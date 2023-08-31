import { Dispatcher } from '@tashmet/bridge';
import { Document, Filter, FindOptions, Namespace, SortingDirection, SortingKey, SortingMap } from '../interfaces.js';
import { AbstractCursor } from './abstractCursor.js';

export function sortingMap(key: SortingKey, direction?: SortingDirection): SortingMap {
  if (typeof key === 'string') {
    return {[key]: direction || 1};
  }
  if (Array.isArray(key)) {
    return key.reduce((o, k) => Object.assign(o, {[k]: direction || 1}), {});
  }
  return key;
}

export class FindCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: Namespace,
    dispatcher: Dispatcher,
    private filter: Filter<TSchema>,
    options: FindOptions = {},
  ) {
    super(namespace, dispatcher, options);
  }

  protected async initialize(): Promise<Document> {
    return this.dispatcher.dispatch(this.namespace, {
      find: this.namespace.coll,
      filter: this.filter,
      ...this.options
    });
  }

  /**
   * Sets the sort order of the cursor query.
   *
   * If the key is either a string or list of strings the direction will be given by the second
   * argument or default to ascending order.
   *
   * If the key is given as a key-value map the sorting direction for each of the keys will be
   * determined by its value and the direction argument can be omitted.
   */
  public sort(key: SortingKey, direction?: SortingDirection): this {
    return this.extendOptions({sort: sortingMap(key, direction)});
  }

  /** Set the skip for the cursor. */
  public skip(count: number): this {
    return this.extendOptions({skip: count});
  }

  /** Set the limit for the cursor. */
  public limit(count: number): this {
    return this.extendOptions({limit: count});
  }

  private extendOptions(options: FindOptions): this {
    Object.assign(this.options, options);
    return this;
  }
}
