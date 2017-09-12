import {QueryOptions} from '../../interfaces';
import {Filter, FilterProvider, Feed, FeedConfig} from '../interfaces';
import {BaseFilter} from './base';
import {View} from '../view';

export function feed(config: FeedConfig): FilterProvider {
  return function (view: View): Filter {
    return new FeedFilter(config, view);
  };
}

export class FeedFilter extends BaseFilter implements Feed {
  private _hasMore = true;

  public constructor(
    private config: FeedConfig,
    view: View
  ) {
    super(view);
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
