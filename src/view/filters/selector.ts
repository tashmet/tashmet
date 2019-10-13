import {QueryOptions} from '../../interfaces';
import {FilterConfig} from '../interfaces';
import {Filter} from '../view';

const assignDeep = require('assign-deep');

/**
 * Configuration options for selector filter
 */
export interface SelectorConfig<T> extends FilterConfig {
  /** Filter value. */
  value?: T;

  /**
   * Function for compiling the selector object based on the value.
   *
   * If no compile function is given the value itself will be used as selector.
   */
  compile?: (value?: T) => object;

  /** Disable the filter when the filter value is equal to this. */
  disableOn?: T;
}

/**
 * A filter that limits documents based on a selector object.
 *
 * A view can have multiple selector filters. Each filter will extend the selector object
 * produced by the previous ones.
 *
 * @usageNotes
 * The simplest form of selector filter is one where the value is simply a selector object.
 * This is especially useful when we just want to create a static filter.
 *
 * ```typescript
 * class MyView extends View {
 *   selector = new SelectorFilter<object>({
 *     value: {category: 'cars'}
 *   });
 * }
 * ```
 *
 * The above view will limit documents to ones where category is equal to 'cars'.
 * Even though the value of the selector can be changed to show another category with this filter
 * there is a better way to do dynamic selectors. Below we create a filter where the selector is
 * instead compiled from a string value. By default the value is 'all' which means we want to show
 * all categories rather than a specific one. To achive this we can disable the filter for a
 * specific value by setting the 'disableOn' property.
 *
 * ```typescript
 * class MyView {
 *   category = new SelectorFilter<string>({
 *     value: 'all',
 *     compile: value => ({category: value}),
 *     disableOn: 'all'
 *   });
 * }
 * ```
 *
 * Changing the category using the above filter is now trivial:
 *
 * ```typescript
 * view.category.value = 'bikes';
 * ```
 */
export class SelectorFilter<T> extends Filter {
  public value: T | undefined;

  public constructor(protected config: SelectorConfig<T>) {
    super(config);
    this.value = config.value;
  }

  public apply(sel: any, options: QueryOptions): void {
    if (this.value === this.config.disableOn) {
      return;
    }
    if (this.config.compile) {
      assignDeep(sel, this.config.compile(this.value));
    } else {
      assignDeep(sel, this.value);
    }
  }
}
