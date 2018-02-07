import {QueryOptions, Sorting, SortingOrder} from '../../interfaces';
import {Filter} from '../interfaces';
import {EventEmitter} from 'eventemitter3';

export class SortingFilter extends Filter {
  public key: string;
  public order: SortingOrder;

  public constructor(private config: Sorting) {
    super();
    this.key = config.key;
    this.order = config.order;
  }

  public apply(selector: any, options: QueryOptions): void {
    if (!options.sort) {
      options.sort = [];
    }
    options.sort.push({key: this.key, order: this.order});
  }
}
