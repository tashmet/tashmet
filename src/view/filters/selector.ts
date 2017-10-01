import {QueryOptions} from '../../interfaces';
import {Filter, SelectorConfig} from '../interfaces';
import {extend} from 'lodash';
import {EventEmitter} from 'eventemitter3';

export class SelectorFilter extends EventEmitter implements Filter {
  public constructor(protected config: SelectorConfig) {
    super();
  }

  public get value(): any {
    return this.config.value;
  }

  public set value(v: any) {
    this.config.value = v;
    this.emit('filter-changed');
  }

  public get template(): any {
    return this.config.template;
  }

  public set template(t: any) {
    this.config.template = t;
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
    if (this.config.template) {
      let computed = JSON.parse(
        JSON.stringify(this.config.template).replace('?', this.config.value));
      extend(sel, computed);
    } else {
      extend(sel, this.config.value);
    }
  }
}
