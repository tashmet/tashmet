import {QueryOptions, Sorting} from '../interfaces';

export interface FilterConfig {
  observe?: string[];
}

export abstract class Filter {
  public dirty = false;

  public observe: string[];

  public constructor(config: FilterConfig) {
    this.observe = config.observe || [];
  }

  public apply(selector: any, options: QueryOptions): void { return; }
}

export interface FeedConfig extends FilterConfig {
  limit: number;

  increment: number;
}

export interface RangeConfig extends FilterConfig {
  offset?: number;

  length: number;
}

export interface SelectorConfig<T> extends FilterConfig {
  value?: T;

  compile?: (value?: T) => object;

  disableOn?: T;
}

export interface SortingConfig extends Sorting, FilterConfig {}
