import {Cursor, Filter, FindOptions, SortingDirection, SortingKey, SortingMap} from './interfaces';

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
  protected _batch: T[] = [];
  protected index = -1;

  public constructor(
    protected filter: Filter<T>,
    protected options: FindOptions = {},
  ) {}

  public sort(key: SortingKey, direction?: SortingDirection): Cursor<T> {
    return this.extendOptions({sort: sortingMap(key, direction)});
  }

  public skip(count: number): Cursor<T> {
    return this.extendOptions({skip: count});
  }

  public limit(count: number): Cursor<T> {
    return this.extendOptions({limit: count});
  }

  public abstract toArray(): Promise<T[]>;

  public abstract count(applySkipLimit?: boolean): Promise<number>;

  public async next(): Promise<T | null> {
    const batch = await this.getBatch();
    return batch.length > this.index ? batch[this.index++] : null;
  }

  public async hasNext(): Promise<boolean> {
    return (await this.getBatch()).length > this.index;
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return (await this.getBatch()).forEach(iterator);
  }

  private extendOptions(options: FindOptions): Cursor<T> {
    Object.assign(this.options, options);
    return this;
  }

  protected async getBatch(): Promise<T[]> {
    if (this.index === -1) {
      this.index = 0;
      return this._batch = (await this.toArray());
    }
    return this._batch;
  }
}