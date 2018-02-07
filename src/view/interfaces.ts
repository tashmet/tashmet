import {QueryOptions} from '../interfaces';

export interface FilterConfig {
  observe: string[];
}

export abstract class Filter {
  public dirty = false;

  public apply(selector: any, options: QueryOptions): void { return; }
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
