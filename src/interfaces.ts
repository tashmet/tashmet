import {Injector} from '@ziggurat/tiamat';
import {Document} from './models/document';
import {Pipe} from './processing/interfaces';
import * as Promise from 'bluebird';

export type ClassType<T> = { new (...args: any[]): T; };

/**
 * Generic interface for creating collections.
 */
export interface CollectionFactory<T> {
  /**
   * Create a new collection given a name and configuration.
   */
  createCollection(name: string, config: T): Collection;
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
export interface Collection {
  /**
   * Insert a document into the collection. If the document already exists it
   * will be updated.
   * A promise for the upserted document is returned.
   */
  upsert<T extends Document>(obj: T): Promise<T>;

  /**
   * Find documents in the collection.
   */
  find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]>;

  /**
   * Find a single document in the collection.
   */
  findOne<T extends Document>(selector: Object): Promise<T>;

  /**
   * Get the number of documents in the collection that matches a given selector.
   */
  count(selector?: Object): Promise<number>;

  /**
   * Get the name of the collection.
   */
  name(): string;

  /**
   * Listen for when a document in the collection has been added or changed.
   * The callback supplies the document.
   */
  on(event: 'document-upserted', fn: (obj: any) => void): Collection;

  /**
   * Listen for when a document in the collection has been removed.
   * The callback supplies the removed document.
   */
  on(event: 'document-removed', fn: (obj: any) => void): Collection;

  /**
   * Listen for when an error was generated when loading or saving a document
   * in the collection. The callback supplies the document error.
   */
  on(event: 'document-error', fn: (err: DocumentError) => void): Collection;

  /**
   * Listen for when the collection has been synced.
   */
  on(event: 'ready', fn: () => void): Collection;

  emit(event: string, ...args: any[]): void;
}

export interface CacheEvaluator {
  isCached(selector: any, options: QueryOptions): boolean;

  setCached(selector: any, options: QueryOptions): void;

  add(doc: any): void;

  optimizeQuery(selector: any, options: QueryOptions): any;
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
  deserialize(data: string): Promise<Object>;

  serialize(data: Object): Promise<string>;
}

export type SerializerProvider = (injector: Injector) => Serializer;
