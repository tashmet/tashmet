import {QueryOptions} from '../../interfaces';
import {Filter, FilterProvider, Selector} from '../interfaces';
import {BaseFilter} from './base';
import {View} from '../view';
import {extend} from 'lodash';

export function selector(config: Selector): FilterProvider {
  return function (view: View): Filter {
    return new SelectorFilter(config, view);
  };
}

export class SelectorFilter extends BaseFilter implements Selector {
  public constructor(protected config: Selector, view: View) {
    super(view);
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
