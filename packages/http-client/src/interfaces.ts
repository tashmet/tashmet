import {Filter, FindOptions, Document} from '@tashmet/tashmet';
import {QuerySerializer} from '@tashmet/qs-builder';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface HttpClientConfig {
  basePath: string;

  querySerializer: QuerySerializer;

  // emitter?: (collection: Collection, path: string) => DatabaseEventEmitter;

  /**
   * Custom fetch method
   *
   * This is necessary if you want to use the rest collection somewhere else
   * than in the browser or if you want to supply a polyfill for browsers that
   * lack window.fetch support.
   *
   * @default window.fetch
   */
  fetch?: Fetch;

  /** Additional headers */
  headers: Record<string, string>;

  databases: Record<string, HttpStoreConfig>;
}

export interface HttpRestLayer {
  get(path: string, queryString?: string, head?: boolean): Promise<Document>;

  put(path: string, doc: any, id: string): Promise<Document>;

  post(path: string, doc: any): Promise<Document>;

  delete(path: string, id: any): Promise<Document>;
}

export abstract class HttpClientConfig implements HttpClientConfig {}

export interface HttpStoreConfig extends Partial<HttpClientConfig> {
  //ns: Namespace;
  //path: string;
  path: (collection: string) => string;
}

export type SerializeQuery = (filter?: Filter<any>, options?: FindOptions) => string;
