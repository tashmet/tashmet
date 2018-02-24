import {QueryOptions} from '../../interfaces';
import {Filter, FeedConfig} from '../interfaces';
import {View} from '../view';
import {EventEmitter} from 'eventemitter3';

export class FeedFilter extends Filter {
  public limit: number;
  public increment: number;

  private _hasMore = true;
  private pendingIncrement = 0;
  private increments: {[selector: string]: number} = {};

  public constructor(
    view: View,
    config: FeedConfig
  ) {
    super(config);
    this.limit = config.limit;
    this.increment = config.increment;
    view.on('data-updated', (result: any[], totalCount: number | undefined) => {
      if (typeof totalCount !== 'undefined') {
        this._hasMore = result.length < totalCount;
      }
    });
  }

  public loadMore(): void {
    this.pendingIncrement = this.increment;
    this.dirty = true;
  }

  public get hasMore(): boolean {
    return this._hasMore;
  }

  public apply(selector: any, options: QueryOptions): void {
    const key = JSON.stringify(selector);
    if (!(key in this.increments)) {
      this.increments[key] = 0;
    }
    options.limit = this.limit + (this.increments[key] += this.pendingIncrement);
    this.pendingIncrement = 0;
  }
}
