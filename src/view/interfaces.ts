import {QueryOptions} from '../interfaces';

export interface FilterConfig {
  observe?: string[];
}

export abstract class Filter {
  public dirty = false;

  public observe: string[];

  public constructor(config: FilterConfig) {
    this.observe = config.observe || [];
  }

  public apply(selector: object, options: QueryOptions): void { return; }
}
