import {propertyDecorator, Newable} from '@ziggurat/tiamat';
import {QueryOptions, SortingOrder} from '../../interfaces';
import {View, ViewPropertyAnnotation, QueryModifier} from '../view';

export class SortBy extends QueryModifier<SortingOrder> {
  public constructor(private sortKey: string) { super(); }

  public modifyOptions(value: SortingOrder, options: QueryOptions) {
    if (!options.sort) {
      options.sort = {};
    }
    options.sort[this.sortKey] = value;
  }
}

export class SortByAnnotation extends ViewPropertyAnnotation {
  public constructor(
    sortKey: string,
    target: Newable<View<any>>,
    propName: string,
  ) {
    super(new SortBy(sortKey), propName);
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
export const sortBy = <(key: string) => any>
  propertyDecorator(SortByAnnotation);
