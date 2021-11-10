import {limit} from './decorators/operator';
import {ItemSet} from './itemSet';

/**
 * An item set that acts as a feed.
 *
 * This item set is suited for where a list of items are shown and the user has the ability
 * to load more. The feed will keep track of how many items should be displayed.
 *
 * @usageNotes
 * The feed is configured by setting an initial limit and an increment by which the limit is
 * increased each time more items are requested.
 *
 * ```typescript
 * class MyFeed extends Feed {
 *   limit = 10;
 *   increment = 5;
 * }
 * ```
 * Provided that the collection has enough documents available the above feed will make sure that
 * the view has only 10 documents initially. Calling loadMore() will increase the capacity to 15.
 *
 * ```typescript
 * view.loadMore()
 * ```
 */
export abstract class Feed<T = any> extends ItemSet<T> {
  /** Initial number of documents to include in the feed. */
  @limit public limit: number;

  /** Number of documents to increment by when loading more. */
  public increment: number;

  /** Load more documents by increasing the limit with the value of the increment. */
  public async loadMore(): Promise<T[]> {
    this.limit = this.limit + this.increment;
    return this.refresh();
  }

  /** Check if there are more documents to load. */
  public hasMore(): boolean {
    return this.matchingCount - this.data.length > 0;
  }
}
