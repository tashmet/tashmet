import {QueryOptions} from '../../interfaces';
import {Filter, FeedConfig} from '../interfaces';
import {View} from '../view';

/**
 * A filter that provides a feed.
 *
 * This filter is suited for where a list of items are shown and the user has the ability
 * to load more. The feed will keep track of how many items should be displayed and whether or not
 * there are more items available.
 *
 * @usageNotes
 * The feed is configured by setting an initial limit and an increment by which the limit is
 * expanded each time more items are requested.
 *
 * ```typescript
 * class MyView {
 *   feed = new FeedFilter({
 *     limit: 10,
 *     increment: 5
 *   });
 * }
 * ```
 * Provided that the collection has enough documents available the above feed will make sure that
 * the view has only 10 documents initially. By calling hasMore() on the feed we can determine if
 * there are more documents that can be loaded into the view. Calling the loadMore() method will
 * increase the capacity to 15 documents.
 *
 * ```typescript
 * if (view.feed.hasMore()) {
 *   view.feed.loadMore()
 * }
 * ```
 */
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

  /**
   * Load more documents by increasing the limit with the value of the increment.
   */
  public loadMore(): void {
    this.pendingIncrement = this.increment;
    this.dirty = true;
  }

  /**
   * Check if there are more documents in the collection currently filtered out by the feed.
   *
   * @returns true if there are more items available.
   */
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
