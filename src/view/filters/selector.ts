import {QueryOptions} from '../../interfaces';
import {Filter, SelectorConfig} from '../interfaces';
import {extend} from 'lodash';
import {EventEmitter} from 'eventemitter3';

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
