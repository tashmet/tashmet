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

  public apply(selector: any, options: QueryOptions): void {
    if (this.config.value === this.config.disableOn) {
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
