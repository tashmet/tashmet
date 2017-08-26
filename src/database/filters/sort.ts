import {View, QueryOptions, Filter, Sorting, SortingOrder} from '../../interfaces';
import {BaseFilter} from './base';

export function sortFilter(config: Sorting) {
  return function (view: View): Filter {
    return new SortFilterImpl(config, view);
  };
}

export class SortFilterImpl extends BaseFilter {
  public constructor(private config: Sorting, view: View) {
    super(view);
  }

  public apply(selector: any, options: QueryOptions): void {
    if (!options.sort) {
      options.sort = [];
    }
    options.sort.push(this.config);
  }
}
