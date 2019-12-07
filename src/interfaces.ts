import {Factory} from '@ziggurat/tiamat';

export enum SortingOrder {
  Ascending = 1,
  Descending = -1
}

/**
 *
 */
export interface QueryOptions {
  /**
   * Sort by one or more properties in ascending or descending order.
   */
  sort?: {[key: string]: SortingOrder};

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
export interface Collection<U = any> {
  /**
   * Name of the collection.
   */
  readonly name: string;

  /**
   * Insert a document into the collection.
   *
   * If the document already exists it will be updated.
   *
   * @param doc The document to insert.
   * @returns A promise for the upserted document.
   */
  upsert<T extends U = any>(doc: T): Promise<T>;

  /**
   * Find documents in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @param options A set of options determining sorting order, limit and offset.
   * @returns A promise for the list of matching documents.
   */
  find<T extends U = any>(selector?: object, options?: QueryOptions): Promise<T[]>;

  /**
   * Find a single document in the collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the first matching document if one was found.
   * @throws DocumentError if no document was found.
   */
  findOne<T extends U = any>(selector: object): Promise<T>;

  /**
   * Remove all documents matching selector from collection.
   *
   * @param selector The selector which documents are matched against.
   * @returns A list of all the documents that were removed.
   */
  remove<T extends U = any>(selector: object): Promise<T[]>;

  /**
   * Get the number of documents in the collection that matches a given selector.
   *
   * @param selector The selector which documents are matched against.
   * @returns A promise for the document count.
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

  emit(event: string, ...args: any[]): void;
}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  }
}

export class Middleware<T = any> {
  public constructor(protected source: Collection<T>) {}
}

export abstract class MiddlewareFactory<T = any> extends Factory<Middleware<T> | Middleware<T>[]> {
  public abstract create(source: Collection): Middleware<T> | Middleware<T>[];
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
  public abstract create(name: string): Collection<T>;
}
