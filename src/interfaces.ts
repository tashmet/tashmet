import {Injector} from '@samizdatjs/tiamat';

/**
 * The cache holds collections of documents in memory.
 */
export interface LocalDatabase {
  /**
   * Create a new collection given a name.
   */
  createCollection(name: string): Collection;
}

export interface RemoteDatabase {
  /**
   * Create a new collection given a name.
   */
  createCollection(name: string): Collection;
}

/**
 * A collection of documents.
 */
export interface Collection {
  upsert(obj: any): Promise<any>;

  find(filter: Object, options: Object): Promise<any>;

  findOne(filter: Object, options: Object): Promise<any>;

  name(): string;

  on(event: string, fn: (obj: any) => void): void;

  emit(event: string, ...args: any[]): void;
}

/**
 *
 */
export interface CollectionConfig {
  /**
   * The unique identifier that the collection provides an instance for.
   * This is used for injecting the collection into any component.
   */
  providerFor: string;

  /**
   * An optional json schema that will be used for validating and providing
   * default values to all documents in the collection.
   */
  schema?: any;
}

export type CollectionProvider = (injector: Injector) => Collection;

/**
 *
 */
export interface Database {
  collection(name: string): Collection;

  on(event: string, fn: any): void;
}

export interface CollectionMapping {
  name: string;

  source: string | CollectionProvider;
}

export interface DatabaseConfig {
  mappings: CollectionMapping[];
}

export class DocumentError extends Error {
  public name = 'DocumentError';

  public constructor(public instance: any, message: string) {
    super(message);
  };
}

export interface Document {
  /**
   * Get the content of the document as an object.
   *
   * If a copy of the document does not exist in its collection a new one will
   * be created and returned with the default values from the schema.
   */
  get(): Promise<any>;

  /**
   * Set the content of the document.
   */
  set(obj: any): Promise<any>;

  /**
   * Listen for when the document has been added or changed.
   * The callback supplies the document.
   */
  on(event: 'document-upserted', fn: (obj: any) => void): Document;

  /**
   * Listen for when the document has been removed.
   * The callback supplies the removed document.
   */
  on(event: 'document-removed', fn: (obj: any) => void): Document;

  /**
   * Listen for when an error was generated when loading or saving the document.
   * The callback supplies the document error.
   */
  on(event: 'document-error', fn: (err: DocumentError) => void): Document;
}

/**
 * A pipe processes a single document and provides the result through a callback.
 * Multiple pipes can be chained together to form a pipeline.
 */
export interface Pipe {
  /**
   * Processes the input and passes the result to the 'next'-callback.
   * If an error occurs, it can be passed to the callback instead.
   */
  process(input: any, next: (output: any) => void): void;
}

/**
 *
 */
export interface Serializer {
  parse(data: string): Object;

  serialize(data: any): string;
}

export interface ServerConfig {
  url: string;
}
