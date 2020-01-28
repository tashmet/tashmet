import {Annotation} from '@ziqquratu/core';
import {Collection, QueryOptions, SortingOrder} from '@ziqquratu/database';
import mingo from 'mingo';
import {getType} from 'reflect-helper';
const assignDeep = require('assign-deep');

export interface Selection<T> {
  one(): Promise<T>;
  all(): Promise<T[]>;
  count(): Promise<number>;
  test(doc: T): boolean;
}

export interface Range {
  offset?: number;
  limit?: number;
}

export class Cursor<T = any> implements Selection<T> {
  public constructor(
    private collection: Collection<T>,
    private selector: object = {},
    private options: QueryOptions = {},
  ) {}

  public filter(selector: object): Cursor {
    return new Cursor(this.collection, assignDeep({}, this.selector, selector), this.options);
  }

  public sort(key: string, order: SortingOrder): Cursor {
    return this.extendOptions({sort: {[key]: order}});
  }

  public skip(count: number): Cursor {
    return this.extendOptions({offset: count});
  }

  public limit(count: number): Cursor {
    return this.extendOptions({limit: count});
  }

  public one(): Promise<T> {
    return this.collection.findOne(this.selector);
  }

  public all(): Promise<T[]> {
    return this.collection.find(this.selector, this.options);
  }

  public count(): Promise<number> {
    return this.collection.count(this.selector);
  }

  public test(doc: T): boolean {
    return new mingo.Query(this.selector).test(doc);
  }

  private extendOptions(options: QueryOptions) {
    return new Cursor(this.collection, this.selector, assignDeep({}, this.options, options));
  }
}

export class QueryPropertyAnnotation extends Annotation {
  public apply(cursor: Cursor, value: any): Cursor {
    return cursor;
  }
}

export abstract class Query<T = any> implements Selection<T>, Range {
  public offset = 0;
  public limit: number | undefined;

  public constructor(protected collection: Collection<T>) {}

  public async one(): Promise<T> {
    return this.compileQuery().one();
  }

  public async all(): Promise<T[]> {
    return this.compileQuery().all();
  }

  public async count(): Promise<number> {
    return this.compileQuery().count();
  }

  public test(doc: T): boolean {
    return this.compileQuery().test(doc);
  }

  protected get target(): Range {
    return this;
  }

  private compileQuery(): Selection<T> {
    let cursor = new Cursor(this.collection);

    for (const prop of getType(this.target.constructor).properties) {
      for (const annotation of prop.getAnnotations(QueryPropertyAnnotation)) {
        cursor = annotation.apply(cursor, (this.target as any)[prop.name]);
      }
    }
    if (this.target.limit) {
      cursor = cursor.limit(this.target.limit);
    }
    if (this.target.offset) {
      cursor = cursor.skip(this.target.offset);
    }
    return cursor;
  }
}
