import {Injector} from '@ziggurat/tiamat';
import {Document} from './models/document';

export type ClassType<T> = { new (...args: any[]): T; };

/**
 * Generic interface for creating collections.
 */
export interface CollectionFactory<T, U extends Document = Document> {
  /**
   * Create a new collection given a name and configuration.
   */
  createCollection(name: string, config: T): Collection<U>;
}

export interface MemoryCollectionConfig {
  indices?: string[];
}

export interface RemoteCollectionConfig {
  path: string;
}

export enum SortingOrder {
  Ascending = 'asc',
  Descending = 'desc'
}

export interface Sorting {
  key: string;

  order: SortingOrder;
}

/**
 *
 */
export interface QueryOptions {
  /**
   * Sort by one or more properties in ascending or descending order.
   */
  sort?: Sorting[];

  /**
   * Skip the first number of documents from the results.
   */
  offset?: number;

  /**
   * Limit the number of items that are fetched.
   */
  limit?: number;
}

/**
 * A collection of documents.
 */
export interface Collection<U extends Document = Document> {
  /**
   * Name of the collection.
   */
  readonly name: string;

  /**
   * Insert a document into the collection.
   *
   * If the document already exists it will be updated.
   * A promise for the upserted document is returned.
   */
  upsert<T extends U>(doc: T): Promise<T>;

  /**
   * Find documents in the collection.
   */
  find<T extends U>(selector?: object, options?: QueryOptions): Promise<T[]>;

  /**
   * Find a single document in the collection.
   */
  findOne<T extends U>(selector: object): Promise<T>;

  /**
   * Remove all documents matching selector from collection.
   *
   * Returns a list of all the documents that were removed.
   */
  remove<T extends U>(selector: object): Promise<T[]>;

  /**
   * Get the number of documents in the collection that matches a given selector.
   */
  count(selector?: object): Promise<number>;

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

  /**
   * Listen for when the collection has been synced.
   */
  on(event: 'ready', fn: () => void): Collection<U>;

  emit(event: string, ...args: any[]): void;
}

export interface CacheEvaluator {
  isCached(selector: object, options: QueryOptions): boolean;

  setCached(selector: object, options: QueryOptions): void;

  add(doc: any): void;

  optimizeQuery(selector: object, options: QueryOptions): void;

  invalidate(): void;
}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  }
}

/**
 *
 */
export interface Serializer {
  deserialize(data: string): Promise<object>;

  serialize(data: object): Promise<string>;
}

export type SerializerProvider = (injector: Injector) => Serializer;

/**
 * An enumeration of the different pipes that can be hooked into by database middleware,
 */
export enum Pipe {
  /**
   * Population of collection from its source.
   *
   * steps: Validate -> Cache
   */
  Populate = 'populate',

  /**
   * Document being upserted to controller by upsert() method.
   *
   * steps: Validate -> Cache -> Persist
   */
  Upsert = 'upsert',

  /**
   * Document being removed from controller by remove() method.
   *
   * steps: Uncache -> Unpersist
   */
  Remove = 'remove',

  /**
   * Document being upserted to collection as a result of getting a 'document-upserted' event
   * from the source collection.
   *
   * steps: Validate -> Cache
   */
  SourceUpsert = 'source-upsert',

  /**
   * Document being removed from collection as a result of getting a 'document-removed' event
   * from the source collection.
   *
   * steps: Uncache
   */
  SourceRemove = 'source-remove',
}

/**
 * An enumeration of the different steps that can be hooked into by database middleware,
 */
export enum Step {
  /**
   * Validation of document according to its model schema.
   */
  Validate = 'validate',

  /**
   * Upserting of document to cache collection.
   */
  Cache = 'cache',

  /**
   * Removal of document from cache collection.
   */
  Uncache = 'uncache',

  /**
   * Upserting of document to source collection.
   */
  Persist = 'persist',

  /**
   * Removal of document from source collection.
   */
  Unpersist = 'unpersist'
}
