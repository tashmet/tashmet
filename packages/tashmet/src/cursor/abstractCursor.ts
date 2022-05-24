import { Cursor, Dispatcher, Document, Filter, FindOptions, Namespace, SortingDirection, SortingKey, SortingMap } from '../interfaces';
import { AggregateOptions } from '../operations/aggregate';

export function applyFindOptions(cursor: Cursor<any>, options: FindOptions): Cursor<any> {
  if (options.sort) {
    cursor.sort(options.sort);
  }
  if (options.skip) {
    cursor.skip(options.skip);
  }
  if (options.limit) {
    cursor.limit(options.limit);
  }
  return cursor;
}

export function sortingMap(key: SortingKey, direction?: SortingDirection): SortingMap {
  if (typeof key === 'string') {
    return {[key]: direction || 1};
  }
  if (Array.isArray(key)) {
    return key.reduce((o, k) => Object.assign(o, {[k]: direction || 1}), {});
  }
  return key;
}

export abstract class AbstractCursor<T> implements Cursor<T> {
  protected buffer: T[] = [];
  protected index = -1;

  public constructor(
    protected filter: Filter<T>,
    protected options: FindOptions = {},
  ) {}

  [Symbol.asyncIterator](): AsyncIterator<T, void> {
    return {
      next: () =>
        this.next().then(value =>
          value != null ? { value, done: false } : { value: undefined, done: true }
        )
    };
  }

  public sort(key: SortingKey, direction?: SortingDirection): Cursor<T> {
    return this.extendOptions({sort: sortingMap(key, direction)});
  }

  public skip(count: number): Cursor<T> {
    return this.extendOptions({skip: count});
  }

  public limit(count: number): Cursor<T> {
    return this.extendOptions({limit: count});
  }

  public toArray(): Promise<T[]> {
    return this.fetchAll();
  }

  public async count(applySkipLimit?: boolean): Promise<number> {
    await this.fetchBatch();
    return this.buffer.length;
  }

  public async next(): Promise<T | null> {
    await this.fetchBatch();
    return this.buffer.length > this.index ? this.buffer[this.index++] : null;
  }

  public async hasNext(): Promise<boolean> {
    await this.fetchBatch();
    return this.buffer.length > this.index;
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    await this.fetchBatch();
    return this.buffer.forEach(iterator);
  }

  private extendOptions(options: FindOptions): Cursor<T> {
    Object.assign(this.options, options);
    return this;
  }

  protected async fetchBatch(): Promise<T[]> {
    if (this.index === -1) {
      this.index = 0;
      return this.buffer = (await this.fetchAll());
    }
    return this.buffer;
  }

  protected abstract fetchAll(): Promise<T[]>;
}

export class FindCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    protected ns: Namespace,
    protected dispatcher: Dispatcher,
    filter: Filter<TSchema>,
    options: FindOptions = {},
  ) {
    super(filter, options);
  }

  protected async fetchAll(): Promise<TSchema[]> {
    const findResult = await this.dispatcher.dispatch(this.ns, {find: this.ns.coll, filter: this.filter, ...this.options});
    return findResult.cursor.firstBatch;
  }
}

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    protected ns: Namespace,
    protected dispatcher: Dispatcher,
    private pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super({}, options);
  }

  protected async fetchAll(): Promise<TSchema[]> {
    const findResult = await this.dispatcher.dispatch(this.ns, {
      aggregate: this.ns.coll,
      pipeline: this.pipeline,
      ...this.options
    });
    return findResult.cursor.firstBatch;
  }
}
