import {View, QueryOptions, Filter} from '../../interfaces';
import {BaseFilter} from './base';

export function sortFilter(sort: any) {
  return function (view: View): Filter {
    return new SortFilterImpl(sort, view);
  };
}

export class SortFilterImpl extends BaseFilter {
  public constructor(private sort: any, view: View) {
    super(view);
  }

  public apply(selector: any, options: QueryOptions): void {
    options.sort = this.sort;
  }
}
