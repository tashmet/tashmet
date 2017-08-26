import {View, QueryOptions, Filter, FeedFilter} from '../../interfaces';
import {BaseFilter} from './base';

export function feedFilter(limit: number, increment: number) {
  return function (view: View): FeedFilter {
    return new FeedFilterImpl(limit, increment, view);
  };
}

export class FeedFilterImpl extends BaseFilter implements FeedFilter {
  private _hasMore = true;

  public constructor(
    private limit: number,
    private loadCount: number,
    view: View
  ) {
    super(view);
    view.on('data-updated', (result: any[], totalCount: number) => {
      this._hasMore = result.length < totalCount;
    });
  }

  public loadMore(): void {
    this.limit += this.loadCount;
    this.emit('filter-changed');
  }

  public hasMore(): boolean {
    return this._hasMore;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.limit = this.limit;
  }
}
