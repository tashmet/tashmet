import {Annotation} from '@ziqquratu/core';
import {Collection, Cursor, QueryOptions, Selector} from '@ziqquratu/database';
import {getType} from 'reflect-helper';

export interface Query extends QueryOptions {
  selector?: object;
}

export interface ResultSet<T> {
  data: T[];
  totalCount: number;
  excludedCount: number;
}

export class SelectorPropertyAnnotation extends Annotation {
  public apply(selector: Selector, value: any): void {
    return;
  }
}

export class CursorPropertyAnnotation extends Annotation {
  public apply(cursor: Cursor<any>, value: any): void {
    return;
  }
}

export function makeSelector(query: any): Selector {
  if (query.selector) {
    return new Selector(query.selector);
  }
  const selector = new Selector();
  for (const prop of getType(query.constructor).properties) {
    for (const annotation of prop.getAnnotations(SelectorPropertyAnnotation)) {
      annotation.apply(selector, (query as any)[prop.name]);
    }
  }
  return selector;
}

export function bindQuery<T>(query: any, collection: Collection<T>): BoundQuery<T> {
  return new BoundQuery(query, collection);
}

export class BoundQuery<T = any> {
  public constructor(
    private query: Query,
    private collection: Collection<T>
  ) {}

  public toCursor(): Cursor<T> {
    const cursor = this.collection.find(makeSelector(this.query).value);

    for (const prop of getType(this.query.constructor).properties) {
      for (const annotation of prop.getAnnotations(CursorPropertyAnnotation)) {
        annotation.apply(cursor, (this.query as any)[prop.name]);
      }
    }
    if (this.query.limit) {
      cursor.limit(this.query.limit);
    }
    if (this.query.skip) {
      cursor.skip(this.query.skip);
    }
    return cursor;
  }

  public one(): Promise<T | null> {
    return this.toCursor().next();
  }

  public async many(): Promise<ResultSet<T>> {
    const data = await this.toCursor().toArray();
    const totalCount = await this.toCursor().count(false);

    return {data, totalCount, excludedCount: totalCount - data.length};
  }
}
