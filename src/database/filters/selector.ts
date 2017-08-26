import {View, QueryOptions, Filter, SelectorFilter, SelectorFilterConfig} from '../../interfaces';
import {BaseFilter} from './base';
import {extend} from 'lodash';

export function selectorFilter(config: SelectorFilterConfig) {
  return function (view: View): SelectorFilter {
    return new SelectorFilterImpl(config, view);
  };
}

export class SelectorFilterImpl extends BaseFilter implements SelectorFilter {
  public constructor(protected config: SelectorFilterConfig, view: View) {
    super(view);
  }

  public set(value: any): void {
    this.config.value = value;
    this.config.disabled = false;
    this.emit('filter-changed');
  }

  public get(): any {
    return this.config.value;
  }

  public disable(): void {
    this.config.disabled = true;
    this.emit('filter-changed');
  }

  public apply(selector: any, options: QueryOptions): void {
    if (this.config.disabled) {
      return;
    }
    if (this.config.template) {
      let computed = JSON.parse(
        JSON.stringify(this.config.template).replace('?', this.config.value));
      extend(selector, computed);
    } else {
      extend(selector, this.config.value);
    }
  }
}
