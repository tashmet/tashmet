import {View, QueryOptions, Filter, Sorting, SortingOrder} from '../../interfaces';
import {BaseFilter} from './base';

export function sortFilter(config: Sorting) {
  return function (view: View): Filter {
    return new SortFilterImpl(config, view);
  };
}

export class SortFilterImpl extends BaseFilter implements Sorting {
  public constructor(private config: Sorting, view: View) {
    super(view);
  }

  public get key(): string {
    return this.config.key;
  }

  public set key(k: string) {
    this.config.key = k;
    this.emit('filter-changed');
  }

  public get order(): SortingOrder {
    return this.config.order;
  }

  public set order(o: SortingOrder) {
    this.config.order = o;
    this.emit('filter-changed');
  }

  public apply(selector: any, options: QueryOptions): void {
    if (!options.sort) {
      options.sort = [];
    }
    options.sort.push(this.config);
  }
}
