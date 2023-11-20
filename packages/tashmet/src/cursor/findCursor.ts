import { Document, FindOptions, SortingDirection, SortingKey, SortingMap, TashmetProxy } from '../interfaces.js';
import { TashmetCollectionNamespace } from '../utils.js';
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
    namespace: TashmetCollectionNamespace,
    proxy: TashmetProxy,
    private filter: Document = {},
    options: FindOptions = {},
  ) {
    super(namespace, proxy, options);
  }

  protected async initialize(): Promise<Document> {
    return this.proxy.command(this.namespace, {
      find: this.namespace.collection,
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
  sort(key: SortingKey, direction?: SortingDirection): this {
    return this.extendOptions({sort: sortingMap(key, direction)});
  }

  /** Set the skip for the cursor. */
  skip(count: number): this {
    return this.extendOptions({skip: count});
  }

  /** Set the limit for the cursor. */
  limit(count: number): this {
    return this.extendOptions({limit: count});
  }

  private extendOptions(options: FindOptions): this {
    Object.assign(this.options, options);
    return this;
  }
}
