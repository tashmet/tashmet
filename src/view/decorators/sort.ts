import {propertyDecorator, Newable} from '@ziggurat/tiamat';
import {SortingOrder} from '../../interfaces';
import {ViewPropertyAnnotation, Query} from '../view';

export class SortByAnnotation extends ViewPropertyAnnotation {
  public constructor(
    private sortKey: string,
    target: Newable<any>,
    propertyKey: string,
  ) {
    super(target, propertyKey);
  }

  public apply(query: Query, value: SortingOrder | undefined) {
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
  propertyDecorator<SortingOrder | undefined>(SortByAnnotation)(key);
