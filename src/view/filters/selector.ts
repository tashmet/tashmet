import {QueryOptions} from '../../interfaces';
import {Filter, FilterConfig} from '../interfaces';
import {extend} from 'lodash';

export interface SelectorConfig<T> extends FilterConfig {
  value?: T;

  compile?: (value?: T) => object;

  disableOn?: T;
}

export class SelectorFilter<T> extends Filter {
  public value: T | undefined;

  public constructor(protected config: SelectorConfig<T>) {
    super(config);
    this.value = config.value;
  }

  public apply(sel: any, options: QueryOptions): void {
    if (this.value === this.config.disableOn) {
      return;
    }
    if (this.config.compile) {
      extend(sel, this.config.compile(this.value));
    } else {
      extend(sel, this.value);
    }
  }
}
