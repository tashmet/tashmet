import {View, QueryOptions, Filter, FeedFilter, SelectorFilter, SelectorFilterConfig} from '../interfaces';
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

export function selectorFilter(config: SelectorFilterConfig) {
  return function (view: View): SelectorFilter {
    return new SelectorFilterImpl(config, view);
  };
}

export class SelectorFilterImpl extends BaseFilter implements SelectorFilter {
  public constructor(protected config: SelectorFilterConfig, view: View) {
    super(view);
  }

  public set(value: any): void {
    this.config.value = value;
    this.config.disabled = false;
    this.emit('filter-changed');
  }

  public get(): any {
    return this.config.value;
  }

  public disable(): void {
    this.config.disabled = true;
    this.emit('filter-changed');
  }

  public apply(selector: any, options: QueryOptions): void {
    if (this.config.disabled) {
      return;
    }
    if (this.config.template) {
      let computed = JSON.parse(
        JSON.stringify(this.config.template).replace('?', this.config.value));
      extend(selector, computed);
    } else {
      extend(selector, this.config.value);
    }
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
