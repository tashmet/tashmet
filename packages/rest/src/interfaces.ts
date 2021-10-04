import {Collection, DatabaseEventEmitter, Query, SortingMap} from '@ziqquratu/database';
import {HttpQueryBuilder} from './query';

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export class Param {
  public constructor(public name: string, public value?: string | number) {}

  public toString() { return `${this.name}=${this.value}`; }
}

export type QueryConverter<T> = (q: Query) => T;
export type QueryParamFactory = QueryConverter<Param[]>

export type QueryStringFactory = (path: string) => HttpQueryBuilder;


export interface RestCollectionConfig {
  path: string;

  queryString?: QueryStringFactory;

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

