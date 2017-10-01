import {QueryOptions} from '../interfaces';

export interface Filter {
  apply(selector: any, options: QueryOptions): void;

  on(event: 'filter-changed', fn: Function): Filter;
}

export interface FeedConfig {
  limit: number;

  increment: number;
}

export interface SelectorConfig {
  value?: any;

  template?: any;

  disableOn?: any;
}
