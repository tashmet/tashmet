import mingo from 'mingo';
import {Cursor, QueryOptions, SortingDirection} from './interfaces';
const assignDeep = require('assign-deep');

export abstract class AbstractCursor<T> implements Cursor<T> {
  public constructor(
    protected selector: object,
    options: QueryOptions = {},
  ) {
    AbstractCursor.applyOptions(this, options);
  }

  public abstract sort(key: string, direction: SortingDirection): Cursor<T>;

  public abstract skip(count: number): Cursor<T>;

  public abstract limit(count: number): Cursor<T>;

  public abstract toArray(): Promise<T[]>;

  public abstract count(applySkipLimit?: boolean): Promise<number>;

  public static applyOptions(cursor: Cursor<any>, options: QueryOptions): Cursor<any> {
    if (options.sort) {
      for (const [key, direction] of options.sort) {
        cursor.sort(key, direction);
      }
    }
    if (options.skip) {
      cursor.skip(options.skip);
    }
    if (options.limit) {
      cursor.limit(options.limit);
    }
    return cursor;
  }
}

export abstract class CursorWithOptions<T> extends AbstractCursor<T> {
  public constructor(
    selector: object,
    protected options: QueryOptions = {},
  ) {
    super(selector);
  }

  public sort(key: string, direction: SortingDirection): Cursor<T> {
    return this.extendOptions({sort: [[key, direction]]});
  }

  public skip(count: number): Cursor<T> {
    return this.extendOptions({skip: count});
  }

  public limit(count: number): Cursor<T> {
    return this.extendOptions({limit: count});
  }

  private extendOptions(options: QueryOptions): Cursor<T> {
    assignDeep(this.options, options);
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