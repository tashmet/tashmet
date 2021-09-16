import {EventEmitter} from 'eventemitter3';
import {AsyncFactory, Provider} from '@ziqquratu/core';
import {OperatorConfig} from '@ziqquratu/operators';

export enum SortingDirection {
  Ascending = 1,
  Descending = -1
}

export type SortingMap = {[key: string]: SortingDirection};
export type SortingKey = string | string[] | SortingMap;

export type AggregationPipeline = Record<string, any>[];

export interface Cursor<T> {
  /**
   * Sets the sort order of the cursor query.
   *
   * If the key is either a string or list of strings the direction will be given by the second
   * argument or default to ascending order.
   *
   * If the key is given as a key-value map the sorting direction for each of the keys will be
   * determined by its value and the direction argument can be omitted.
   */
  sort(key: SortingKey, direction?: SortingDirection): Cursor<T>;

  /** Set the skip for the cursor. */
  skip(count: number): Cursor<T>;

  /** Set the limit for the cursor. */
  limit(count: number): Cursor<T>;

  /** Returns an array of documents. */
  toArray(): Promise<T[]>;

  /**
   * Get the next available document from the cursor, returns null if no more documents are available
   */
  next(): Promise<T | null>;

  /** Check if there is any document still available in the cursor */
  hasNext(): Promise<boolean>;

  /** Iterates over all the documents for this cursor using the iterator, callback pattern */
  forEach(iterator: (doc: T) => void): Promise<void>;

  /**
   * Get the count of documents for this cursor
   *
   * @param applySkipLimit Should the count command apply limit and skip settings on the cursor.
   */
  count(applySkipLimit?: boolean): Promise<number>;
}

/**
 *
 */
export interface QueryOptions {
  /**
   * Set to sort the documents coming back from the query. Key-value map, ex. {a: 1, b: -1}
   */
  sort?: SortingMap;

  /**
   * Skip the first number of documents from the results.
   */
  skip?: number;

  /**
   * Limit the number of items that are fetched.
   */
  limit?: number;
}

export interface ReplaceOneOptions {
  /** When true, creates a new document if no document matches the query. */
  upsert?: boolean;
}

export interface DatabaseEventEmitter {
  on(event: 'change', fn: (change: DatabaseChange) => void): this;

  on(event: 'error', fn: (error: DatabaseError) => void): this;
}

/**
 * A collection of documents.
 */
export declare interface Collection<T = any> {
  /**
   * Name of the collection.
   */
  readonly name: string;

  /* Execute an aggregation framework pipeline against the collection */
  aggregate<U>(pipeline: AggregationPipeline): Promise<U[]>

  /**
   * Insert a document into the collection.
   *
   * If the document passed in do not contain the _id field, one will be added to it
   *
   * @param doc The document to insert.
   * @returns A promise for the inserted document.
   * @throws Error if a document with the same ID already exists
   */
  insertOne(doc: T): Promise<T>;

  /**
   * Insert multiple documents into the collection
   *
   * If documents passed in do not contain the _id field, one will be added to
   * each of the documents missing it
   *
   * @param docs The documents to insert
   * @returns A promise for the inserted documents
   * @throws Error if a document with the same ID already exists
   */
  insertMany(docs: T[]): Promise<T[]>;

  /**
   * Replace a document in a collection with another document
   *
   * @param selector The Filter used to select the document to replace
   * @param doc The Document that replaces the matching document
   * @param options Optional settings
   * @returns A promise for the new document
   */
  replaceOne(selector: object, doc: T, options?: ReplaceOneOptions): Promise<T | null>;

  /**
   * Find documents in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A cursor.
   */
  find(selector?: object, options?: QueryOptions): Cursor<T>;

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found, null otherwise
   */
  findOne(selector: object): Promise<T | null>;

  /**
   * Delete a document from a collection
   *
   * @param selector The Filter used to select the document to remove
   * @returns The removed document if found, null otherwise
   */
  deleteOne(selector: object): Promise<T | null>;

  /**
   * Delete multiple documents from a collection
   *
   * @param selector The Filter used to select the documents to remove
   * @returns A list of all the documents that were removed
   */
  deleteMany(selector: object): Promise<T[]>;
}

export abstract class Collection extends EventEmitter implements Collection, DatabaseEventEmitter {}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  }
}

export class DatabaseError extends DocumentError {
  public name = 'DatabaseError';

  public constructor(
    public collection: Collection,
    instance: any,
    message: string
  ) { super(instance, message); }
}

export interface EventMiddleware<T = any> {
  'change'?: (next: (change: DatabaseChange<T>) => Promise<void>, change: DatabaseChange) => Promise<void>;
  'error'?: (next: (error: DatabaseError) => Promise<void>, error: DatabaseError) => Promise<void>;
}

export interface MethodMiddleware<T = any> {
  find?: (
    next: (selector?: object, options?: QueryOptions) => Cursor<T>,
    selector?: object,
    options?: QueryOptions
  ) => Cursor<T>;

  findOne?: (
    next: (selector: object) => Promise<T | null>,
    selector: object
  ) => Promise<T | null>;

  insertOne?: (
    next: (doc: T) => Promise<T>,
    doc: T
  ) => Promise<T>;

  insertMany?: (
    next: (docs: T[]) => Promise<T[]>,
    docs: T[]
  ) => Promise<T[]>;

  replaceOne?: (
    next: (selector: object, doc: T, options?: ReplaceOneOptions) => Promise<T | null>,
    selector: object,
    doc: T,
    options?: ReplaceOneOptions
  ) => Promise<T | null>;

  deleteOne?: (
    next: (selector: object) => Promise<T>,
    selector: object
  ) => Promise<T | null>;

  deleteMany?: (
    next: (selector: object) => Promise<T[]>,
    selector: object
  ) => Promise<T[]>;
}

export interface Middleware<T = any> {
  /** Middleware intercepting method calls on collection. */
  methods?: MethodMiddleware<T>;

  /** Middleware intercepting events emitted from collection. */
  events?: EventMiddleware<T>;
}

export abstract class MiddlewareFactory<T = any> extends AsyncFactory<Middleware<T>> {
  public abstract create(source: Collection, database: Database): Promise<Middleware<T>>;
}


export interface CollectionConfig {
  /**
   * Factory creating the collection.
   */
  source: CollectionFactory;

  /**
   * Optional list of factories creating middleware that should be applied after any middleware
   * from the database.
   */
  use?: MiddlewareFactory[];

  /**
   * Optional list of factories creating middleware that should be applied before any middleware
   * from the database.
   */
  useBefore?: MiddlewareFactory[];
}

/**
 * Configuration for the database.
 */
export interface DatabaseConfig {
  /**
   * A map of producers of collections to be created by the database.
   */
  collections: {[name: string]: CollectionFactory | CollectionConfig};

  /**
   * Optional list of factories creating middleware that should be applied to all collections in
   * the database.
   */
  use?: MiddlewareFactory[];

  /**
   *
   */
  operators: OperatorConfig;
}

export type CollectionChangeAction = 'insert' | 'delete' | 'replace';

export interface DatabaseChange<T = any> {
  data: T[];
  collection: Collection<T>;
  action: CollectionChangeAction;
}

/**
 *
 */
export abstract class Database extends EventEmitter implements DatabaseEventEmitter {
  public static configuration(config: DatabaseConfig) {
    return Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', config);
  }

  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  public abstract collection<T = any>(name: string): Promise<Collection<T>>;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a name and factory.
   *
   * @param name The name of the collection.
   * @param factory The factory creating the collection.
   * @returns An instance of the collection.
   */
  public abstract createCollection<T = any>(name: string, factory: CollectionFactory<T>): Promise<Collection<T>>;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a name and configuration.
   *
   * @param name The name of the collection.
   * @param config The configuration.
   * @returns An instance of the collection.
   */
  public abstract createCollection<T = any>(name: string, config: CollectionConfig): Promise<Collection<T>>;
}

export abstract class CollectionFactory<T = any> extends AsyncFactory<Collection<T>> {
  public abstract create(name: string, database: Database): Promise<Collection<T>>
}
