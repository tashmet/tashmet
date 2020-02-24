import {Factory} from '@ziqquratu/core';

export enum SortingDirection {
  Ascending = 1,
  Descending = -1
}

export type SortingMap = {[key: string]: SortingDirection};
export type SortingKey = string | string[] | SortingMap;

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

/**
 * A collection of documents.
 */
export interface Collection<U = any> {
  /**
   * Name of the collection.
   */
  readonly name: string;

  /**
   * Insert a document into the collection.
   *
   * If the document passed in do not contain the _id field, one will be added to it
   *
   * @param doc The document to insert.
   * @returns A promise for the inserted document.
   * @throws Error if a document with the same ID already exists
   */
  insertOne<T extends U = any>(doc: T): Promise<T>;

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
  insertMany<T extends U = any>(docs: T[]): Promise<T[]>;

  /**
   * Replace a document in a collection with another document
   *
   * @param selector The Filter used to select the document to replace
   * @param doc The Document that replaces the matching document
   * @param options Optional settings
   * @returns A promise for the new document
   */
  replaceOne<T extends U = any>(selector: object, doc: T, options?: ReplaceOneOptions): Promise<T>;

  /**
   * Find documents in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A cursor.
   */
  find<T extends U = any>(selector?: object, options?: QueryOptions): Cursor<T>;

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found, null otherwise
   */
  findOne<T extends U = any>(selector: object): Promise<T | null>;

  /**
   * Delete a document from a collection
   *
   * @param selector The Filter used to select the document to remove
   * @returns The removed document if found, null otherwise
   */
  deleteOne<T extends U = any>(selector: object): Promise<T | null>;

  /**
   * Delete multiple documents from a collection
   *
   * @param selector The Filter used to select the documents to remove
   * @returns A list of all the documents that were removed
   */
  deleteMany<T extends U = any>(selector: object): Promise<T[]>;

  /**
   * Listen for when a document in the collection has been added or changed.
   * The callback supplies the document.
   */
  on(event: 'document-upserted', fn: (obj: any) => void): Collection<U>;

  /**
   * Listen for when a document in the collection has been removed.
   * The callback supplies the removed document.
   */
  on(event: 'document-removed', fn: (obj: any) => void): Collection<U>;

  /**
   * Listen for when an error was generated when loading or saving a document
   * in the collection. The callback supplies the document error.
   */
  on(event: 'document-error', fn: (err: DocumentError) => void): Collection<U>;

  emit(event: string, ...args: any[]): void;
}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  }
}

export interface EventMiddleware<T = any> {
  'document-upserted'?: (next: (doc: T) => Promise<void>, doc: any) => Promise<void>;
  'document-removed'?: (next: (doc: T) => Promise<void>, doc: any) => Promise<void>;
  'document-error'?: (next: (err: DocumentError) => Promise<void>, err: DocumentError) => Promise<void>;
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

export abstract class MiddlewareFactory<T = any> extends Factory<Middleware<T> | Middleware<T>[]> {
  public abstract create(source: Collection, database: Database): Middleware<T> | Middleware<T>[];
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
}

/**
 *
 */
export interface Database {
  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  collection<T = any>(name: string): Collection<T>;

  /**
   * Create a collection.
   *
   * This function will create a new instance given a name and producer / config.
   *
   * @param name The name of the collection.
   * @param factory The factory creating the collection or configuration with factory.
   * @returns An instance of the collection.
   */
  createCollection<T = any>(
    name: string, factory: CollectionFactory<T> | CollectionConfig): Collection<T>;

  /**
   * Listen for when a document in a collection has been added or changed.
   * The callback supplies the document and the collection it was upserted to.
   */
  on(event: 'document-upserted', fn: (obj: any, collection: Collection) => void): Database;

  /**
   * Listen for when a document in a collection has been removed.
   * The callback supplies the removed document and the collection it was removed from.
   */
  on(event: 'document-removed', fn: (obj: any, collection: Collection) => void): Database;

  /**
   * Listen for when an error was generated when loading or saving a document
   * in a collection. The callback supplies the document error and the collection generating it.
   */
  on(event: 'document-error', fn: (err: DocumentError, collection: Collection) => void): Database;
}

export abstract class CollectionFactory<T = any> extends Factory<Collection<T>> {
  public abstract create(name: string, database: Database): Collection<T>;
}
