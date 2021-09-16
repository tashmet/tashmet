import {Collection, DatabaseEventEmitter, QueryOptions} from '@ziqquratu/database';
import {EventEmitter as EM} from 'eventemitter3';

export type MakeQueryParams = (selector: object, options: QueryOptions) => {[name: string]: string};

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface RestCollectionConfig {
  path: string;

  queryParams?: MakeQueryParams;

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
