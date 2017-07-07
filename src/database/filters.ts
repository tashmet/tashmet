import {View, QueryOptions, Filter} from '../interfaces';
import {EventEmitter} from '../util';
import {extend} from 'lodash';

export class BaseFilter extends EventEmitter implements Filter {
  protected view: View;

  public apply(selector: any, options: QueryOptions): void {
    return;
  }

  public setView(view: View): void {
    this.view = view;
  }
}

export class SelectorFilter extends BaseFilter {
  public constructor(protected selector: any) {
    super();
  }

  public apply(selector: any, options: QueryOptions): void {
    extend(selector, this.selector);
  }
}

export abstract class PropertyFilter<T> extends BaseFilter {
  protected value: T | null;

  public constructor(
    protected property: string,
    protected operator: string
  ) {
    super();
  }

  public set(value: T | null): void {
    this.value = value;
    this.emit('filter-changed');
  }

  public reset(): void {
    this.set(null);
  }

  public get(): T | null {
    return this.value;
  }

  public apply(selector: any, options: QueryOptions): void {
    if (this.value) {
      selector[this.property] = {};
      selector[this.property][this.operator] = this.value;
    }
  }
}

export class FeedFilter extends BaseFilter {
  private _hasMore = true;

  public constructor(
    private limit: number,
    private loadCount: number
  ) {
    super();
  }

  public loadMore(): void {
    this.limit += this.loadCount;
    this.emit('filter-changed');
  }

  public hasMore(): boolean {
    return this._hasMore;
  }

  public setView(view: View): void {
    view.on('data-updated', (result: any[], totalCount: number) => {
      this._hasMore = result.length < totalCount;
    });
  }

  public apply(selector: any, options: QueryOptions): void {
    options.limit = this.limit;
  }
}

export class SortFilter extends BaseFilter {
  public constructor(private sort: any) {
    super();
  }

  public apply(selector: any, options: QueryOptions): void {
    options.sort = this.sort;
  }
}
