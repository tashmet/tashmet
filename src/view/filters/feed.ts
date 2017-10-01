import {QueryOptions} from '../../interfaces';
import {Filter, FeedConfig} from '../interfaces';
import {View} from '../view';
import {EventEmitter} from 'eventemitter3';

export class FeedFilter extends EventEmitter implements Filter {
  private _hasMore = true;

  public constructor(
    view: View,
    private config: FeedConfig
  ) {
    super();
    view.on('data-updated', (result: any[], totalCount: number) => {
      this._hasMore = result.length < totalCount;
    });
  }

  public get limit(): number {
    return this.config.limit;
  }

  public set limit(l: number) {
    this.config.limit = l;
    this.emit('filter-changed');
  }

  public get increment(): number {
    return this.config.increment;
  }

  public set increment(i: number) {
    this.config.increment = i;
  }

  public loadMore(): void {
    this.limit += this.config.increment;
  }

  public hasMore(): boolean {
    return this._hasMore;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.limit = this.limit;
  }
}
