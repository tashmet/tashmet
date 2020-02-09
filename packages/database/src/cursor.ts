import mingo from 'mingo';
import {Cursor, QueryOptions, SortingDirection, SortingKey, SortingMap} from './interfaces';
const assignDeep = require('assign-deep');

export function applyQueryOptions(cursor: Cursor<any>, options: QueryOptions): Cursor<any> {
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
  public constructor(
    protected selector: object,
    protected options: QueryOptions = {},
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
    return null;
  }

  public async hasNext(): Promise<boolean> {
    return false;
  }

  private extendOptions(options: QueryOptions): Cursor<T> {
    Object.assign(this.options, options);
    return this;
  }
}

export class Selector {
  public constructor(public value: any = {}) {}

  public filter(value: any): Selector {
    assignDeep(this.value, value);
    return this;
  }

  public test(doc: any): boolean {
    return new mingo.Query(this.value).test(doc);
  }
}