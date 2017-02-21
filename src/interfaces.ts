import {Provider} from '@samizdatjs/tiamat';

/**
 * The cache holds collections of documents in memory.
 */
export interface MemoryDatabase {
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
  upsert(obj: any, fn: () => void): void;

  find(filter: Object, options: Object, fn: (result: any) => void): void;

  findOne(filter: Object, options: Object, fn: (result: any) => void): void;

  name(): string;

  on(event: string, fn: (obj: any) => void): void;

  emit(event: string, ...args: any[]): void;
}

/**
 *
 */
export interface CollectionConfig {
  /**
   * Name of the collection. This should be a unique service identifier that can
   * be used for injecting the collection as a service into any component.
   */
  name: string;

  /**
   * An optional json schema that will be used for validating and providing
   * default values to all documents in the collection.
   */
  schema?: any;
}

/**
 *
 */
export interface Database {
  collection(name: string): Collection;

  on(event: string, fn: any): void;
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
  get(fn: (obj: any) => void): void;

  /**
   * Set the content of the document.
   */
  set(obj: any): void;

  /**
   * Listen for when the document has been added.
   * The callback supplies the added document.
   */
  on(event: 'document-added', fn: (obj: any) => void): Document;

  /**
   * Listen for when the document has been changed.
   * The callback supplies the changed document.
   */
  on(event: 'document-changed', fn: (obj: any) => void): Document;

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
