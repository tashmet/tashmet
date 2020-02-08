
import mingo from 'mingo';
import {Cursor, QueryOptions, SortingDirection} from './interfaces';
const assignDeep = require('assign-deep');

export abstract class AbstractCursor<T> implements Cursor<T> {
  public constructor(
    protected selector: object,
    protected options: QueryOptions = {},
  ) {}

  public sort(key: string, direction: SortingDirection): Cursor<T> {
    return this.extendOptions({sort: [[key, direction]]});
  }

  public skip(count: number): Cursor<T> {
    return this.extendOptions({offset: count});
  }

  public limit(count: number): Cursor<T> {
    return this.extendOptions({limit: count});
  }

  public abstract toArray(): Promise<T[]>;

  public abstract count(applySkipLimit?: boolean): Promise<number>;

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