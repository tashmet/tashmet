import {Collection, DatabaseEventEmitter, QueryOptions} from '@ziqquratu/database';
import {QuerySerializer} from './query';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface RestCollectionConfig {
  path: string;

  queryParams?: QuerySerializer;

  emitter?: (collection: Collection, path: string) => DatabaseEventEmitter;

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
}


export interface JsonQueryConfig {
  /**
   * Name of the filter param
   * @default 'filter'
   */
  filter?: string;

  /**
   * Name of the sort param
   * @default 'sort'
   */
  sort?: string;

  /**
   * Name of the skip param
   * @default 'skip'
   */
  skip?: string;

  /**
   * Name of the limit param
   * @default 'limit'
   */
  limit?: string;
}