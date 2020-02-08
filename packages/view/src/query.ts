import {Annotation} from '@ziqquratu/core';
import {Collection, Cursor, Selector} from '@ziqquratu/database';
import {getType} from 'reflect-helper';

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
  const selector = new Selector();
  for (const prop of getType(query.constructor).properties) {
    for (const annotation of prop.getAnnotations(SelectorPropertyAnnotation)) {
      annotation.apply(selector, query[prop.name]);
    }
  }
  return selector;
}

export function makeCursor<T>(query: any, collection: Collection<T>): Cursor<T> {
  const cursor = collection.find(makeSelector(query).value);

  for (const prop of getType(query.constructor).properties) {
    for (const annotation of prop.getAnnotations(CursorPropertyAnnotation)) {
      annotation.apply(cursor, query[prop.name]);
    }
  }
  if (query.limit) {
    cursor.limit(query.limit);
  }
  if (query.skip) {
    cursor.skip(query.skip);
  }
  return cursor;
}
