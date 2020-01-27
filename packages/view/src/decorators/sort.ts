import {propertyDecorator} from '@ziqquratu/core';
import {SortingOrder} from '@ziqquratu/database';
import {QueryPropertyAnnotation, QueryBuilder} from '../query';

export class SortByAnnotation extends QueryPropertyAnnotation {
  public constructor(private sortKey: string) {
    super();
  }

  public apply(query: QueryBuilder, value: SortingOrder | undefined) {
    if (value !== undefined) {
      query.sort(this.sortKey, value);
    }
  }
}

/**
 * Sort documents according to a given key and order.
 *
 * A view can have multiple sorting properties acting on different keys.
 *
 * @usageNotes
 * Sorting articles according to their publication date could look as following:
 *
 * ```typescript
 * class MyView extends View {
 *   @sortBy('datePublished')
 *   public dateSort = SortingOrder.Descending;
 * }
 * ```
 */
export const sortBy = (key: string) =>
  propertyDecorator<SortingOrder | undefined>(() => new SortByAnnotation(key));
