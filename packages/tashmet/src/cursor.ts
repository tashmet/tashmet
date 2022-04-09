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
  protected buffer: T[] = [];
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
