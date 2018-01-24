import {QueryOptions} from '../../interfaces';
import {Filter, SelectorConfig} from '../interfaces';
import {extend} from 'lodash';
import {EventEmitter} from 'eventemitter3';

export class SelectorFilter<T> extends EventEmitter implements Filter {
  public constructor(protected config: SelectorConfig<T>) {
    super();
  }

  public get value(): any {
    return this.config.value;
  }

  public set value(v: any) {
    this.config.value = v;
    this.emit('filter-changed');
  }

  public get compile(): any {
    return this.config.compile;
  }

  public set compile(c: any) {
    this.config.compile = c;
    this.emit('filter-changed');
  }

  public get disableOn(): any {
    return this.config.disableOn;
  }

  public set disableOn(d: any) {
    this.config.disableOn = d;
    this.emit('filter-changed');
  }

  public apply(sel: any, options: QueryOptions): void {
    if (this.config.value === this.config.disableOn) {
      return;
    }
    if (this.config.compile) {
      extend(sel, this.config.compile(this.config.value));
    } else {
      extend(sel, this.config.value);
    }
  }
}
