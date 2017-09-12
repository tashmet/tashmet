import {Document} from '../models/document';
import {QueryOptions} from '../interfaces';
import {View} from './view';
import * as Promise from 'bluebird';

export interface ViewConfig {
  name: string;

  collection: string;

  filters: {[name: string]: FilterProvider};
}

export interface Filter {
  apply(selector: any, options: QueryOptions): void;

  on(event: 'filter-changed', fn: Function): Filter;
}

export type FilterProvider = (view: View) => Filter;

export interface FeedConfig {
  limit: number;

  increment: number;
}

export interface Feed extends FeedConfig {
  loadMore(): void;

  hasMore(): boolean;
}

export interface Selector {
  value?: any;

  template?: any;

  disableOn?: any;
}
