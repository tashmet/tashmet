import {ItemSet} from './itemSet';
import {Query} from './view';

/**
 * An item set that limits the range of documents.
 *
 * The range view allows us to limit the number of documents displayed in the view to a
 * specific range of the result set.
 *
 * @usageNotes
 * The range is configured by supplying an offset and a optional limit. Here we create a filter
 * that will limit the view to the first 10 matching documents in the collection. Note that
 * omitting the offset in this case would yield the same result.
 *
 * ```typescript
 * class MyRange extends Range {
 *   public offset = 0;
 *   public limit = 10;
 * }
 * ```
 */
export class Range<T = any> extends ItemSet<T> {
  /** Number of documents to skip from the beginning */
  public offset = 0;

  /** Number of documents to include in the range */
  public limit: number | undefined;

  protected query(): Query {
    const query = super.query().skip(this.offset);
    if (this.limit) {
      query.limit(this.limit);
    }
    return query;
  }
}
