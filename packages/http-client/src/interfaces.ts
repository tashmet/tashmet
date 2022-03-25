import {Filter, FindOptions, Namespace} from '@tashmet/database';
import {QuerySerializer} from '@tashmet/qs-builder';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface HttpClientConfig {
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
}

export abstract class HttpClientConfig implements HttpClientConfig {}

export interface HttpStoreConfig extends Partial<HttpClientConfig> {
  ns: Namespace;
  path: string;
}

export type SerializeQuery = (filter?: Filter<any>, options?: FindOptions) => string;
