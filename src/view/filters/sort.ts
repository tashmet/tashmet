import {QueryOptions, Sorting, SortingOrder} from '../../interfaces';
import {Filter} from '../interfaces';
import {EventEmitter} from 'eventemitter3';

export class SortingFilter extends EventEmitter implements Filter {
  public constructor(private config: Sorting) { super(); }

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
