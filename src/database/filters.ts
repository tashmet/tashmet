import {View, QueryOptions, Filter, FeedFilter, SelectorFilter} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {extend} from 'lodash';

export class BaseFilter extends EventEmitter implements Filter {
  public constructor(protected view: View) {
    super();
  }

  public apply(selector: any, options: QueryOptions): void {
    return;
  }
}

export function selectorFilter(selector: any) {
  return function (view: View): SelectorFilter {
    return new SelectorFilterImpl(selector, view);
  };
}

export class SelectorFilterImpl extends BaseFilter implements SelectorFilter {
  public constructor(protected selector: any, view: View) {
    super(view);
  }

  public set(selector: any): void {
    this.selector = selector;
    this.emit('filter-changed');
  }

  public get(): any {
    return this.selector;
  }

  public apply(selector: any, options: QueryOptions): void {
    extend(selector, this.selector);
  }
}

export function valueSelectorFilter(selector: any, initial: any) {
  return function (view: View): SelectorFilter {
    return new ValueSelectorFilterImpl(selector, initial, view);
  };
}

export class ValueSelectorFilterImpl extends BaseFilter implements SelectorFilter {
  protected selector: any = {};
  protected value: any;

  public constructor(protected template: any, initial: any, view: View) {
    super(view);
    this.update(initial);
  }

  public set(value: any): void {
    this.update(value);
    this.emit('filter-changed');
  }

  public get(): any {
    return this.value;
  }

  public apply(selector: any, options: QueryOptions): void {
    extend(selector, this.selector);
  }

  private update(value: any): void {
    this.value = value;
    this.selector = JSON.parse(
      JSON.stringify(this.template).replace('$value', value));
  }
}

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
