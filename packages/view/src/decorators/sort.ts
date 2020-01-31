import {propertyDecorator} from '@ziqquratu/core';
import {Cursor, SortingOrder} from '@ziqquratu/database';
import {CursorPropertyAnnotation} from '../query';

export class SortByAnnotation extends CursorPropertyAnnotation {
  public constructor(private sortKey: string) {
    super();
  }

  public apply(cursor: Cursor<any>, value: SortingOrder | undefined) {
    if (value !== undefined) {
      return cursor.sort(this.sortKey, value);
    }
    return cursor;
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
