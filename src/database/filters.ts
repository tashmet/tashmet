import {View, QueryOptions, Filter, FeedFilter, SelectorFilter} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {extend} from 'lodash';

export class BaseFilter implements Filter {
  public constructor(protected view: View) {}

  public apply(selector: any, options: QueryOptions): void {
    return;
  }
}

export function selectorFilter(selector: any) {
  return function (view: View): SelectorFilter {
    return new SelectorFilterImpl(selector, view);
  };
}

class SelectorFilterImpl extends BaseFilter implements SelectorFilter {
  public constructor(protected selector: any, view: View) {
    super(view);
  }

  public set(selector: any): void {
    this.selector = selector;
    this.view.refresh();
  }

  public get(): any {
    return this.selector;
  }

  public apply(selector: any, options: QueryOptions): void {
    extend(selector, this.selector);
  }
}

export function feedFilter(limit: number, increment: number) {
  return function (view: View): FeedFilter {
    return new FeedFilterImpl(limit, increment, view);
  };
}

class FeedFilterImpl extends BaseFilter implements FeedFilter {
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
    this.view.refresh();
  }

  public hasMore(): boolean {
    return this._hasMore;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.limit = this.limit;
  }
}

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
