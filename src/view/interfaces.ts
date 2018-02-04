import {QueryOptions} from '../interfaces';

export interface Filter {
  apply(selector: any, options: QueryOptions): void;

  on(event: 'filter-changed', fn: Function): Filter;
}

export interface FeedConfig {
  limit: number;

  increment: number;
}

export interface RangeConfig {
  offset?: number;

  length: number;
}

export interface SelectorConfig<T> {
  value?: T;

  compile?: (value?: T) => object;

  disableOn?: T;
}
