import {QueryOptions, Sorting, SortingOrder} from '../../interfaces';
import {FilterConfig} from '../interfaces';
import {Filter} from '../view';

/**
 * Configuration options for sorting filter
 */
export interface SortingConfig extends Sorting, FilterConfig {}

/**
 * A filter that sorts documents according to a given key and order.
 *
 * A view can have multiple sorting filters acting on different keys.
 *
 * @usageNotes
 * A filter for sorting articles according to their publication date could look as following:
 *
 * ```typescript
 * class MyView extends View {
 *   dateSort = new SortingFilter({
 *     key: 'datePublished',
 *     order: SortingOrder.Descending
 *   });
 * }
 * ```
 */
export class SortingFilter extends Filter {
  public key: string;
  public order: SortingOrder;

  public constructor(private config: SortingConfig) {
    super(config);
    this.key = config.key;
    this.order = config.order;
  }

  public apply(selector: any, options: QueryOptions): void {
    if (!options.sort) {
      options.sort = [];
    }
    options.sort.push({key: this.key, order: this.order});
  }
}
