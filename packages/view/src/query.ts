import {Annotation} from '@ziqquratu/core';
import {Collection, Cursor, Selector} from '@ziqquratu/database';
import {getType} from 'reflect-helper';

export interface Range {
  offset?: number;
  limit?: number;
}

export class SelectorPropertyAnnotation extends Annotation {
  public apply(selector: Selector, value: any): Selector {
    return selector;
  }
}

export class CursorPropertyAnnotation extends Annotation {
  public apply(cursor: Cursor<any>, value: any): Cursor<any> {
    return cursor;
  }
}

export abstract class Query<T = any> implements Range {
  public offset = 0;
  public limit: number | undefined;

  public constructor(private collection: Collection<T>) {}

  protected get target(): Range {
    return this;
  }

  public get selector(): Selector {
    let selector = new Selector();
    for (const prop of getType(this.target.constructor).properties) {
      for (const annotation of prop.getAnnotations(SelectorPropertyAnnotation)) {
        selector = annotation.apply(selector, (this.target as any)[prop.name]);
      }
    }
    return selector;
  }

  public get cursor(): Cursor<T> {
    let cursor = this.collection.find(this.selector.value);

    for (const prop of getType(this.target.constructor).properties) {
      for (const annotation of prop.getAnnotations(CursorPropertyAnnotation)) {
        cursor = annotation.apply(cursor, (this.target as any)[prop.name]);
      }
    }
    if (this.target.limit) {
      cursor.limit(this.target.limit);
    }
    if (this.target.offset) {
      cursor.skip(this.target.offset);
    }
    return cursor;
  }
}
