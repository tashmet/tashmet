import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import {getType} from 'reflect-helper';
import {Annotation} from '@ziqquratu/reflection';
import {Collection, QueryOptions, SortingOrder} from '@ziqquratu/database';

const assignDeep = require('assign-deep');

export class ViewPropertyAnnotation extends Annotation {
  public apply(query: Query, value: any): void { return; }
}

export class Query {
  public constructor(
    public selector: object = {},
    public options: QueryOptions = {},
  ) {}

  public select(selector: object): Query {
    assignDeep(this.selector, selector);
    return this;
  }

  public sort(key: string, order: SortingOrder): Query {
    if (!this.options.sort) {
      this.options.sort = {};
    }
    this.options.sort[key] = order;
    return this;
  }

  public skip(count: number): Query {
    this.options.offset = count;
    return this;
  }

  public limit(count: number): Query {
    this.options.limit = count;
    return this;
  }
}

/**
 * A view representing a subset of documents within a collection.
 *
 * This class can be extended in order to create a view that tracks documents in a collection
 * based on one or more filters. Filters can be added as members on the view. When the view is
 * refreshed (either manually by calling refresh() or as a consequence of one of its filters
 * having been changed) a selector object and query options are passed through each filter and
 * finally used to query the collection.
 */
export abstract class View<T> extends EventEmitter {
  protected _data: T;

  public constructor(public readonly collection: Collection) {
    super();
    collection.on('document-upserted', (doc: any) => {
      this.onDocumentChanged(doc);
    });
    collection.on('document-removed', (doc: any) => {
      this.onDocumentChanged(doc);
    });
  }

  /**
   * A document or list of documents in this view.
   */
  public get data(): T {
    return this._data;
  }

  /**
   * Manually trigger a refresh of the view.
   */
  public abstract refresh(): Promise<T>;

  protected query(): Query {
    const query = new Query();

    for (const prop of getType(this.constructor).properties) {
      for (const annotation of prop.getAnnotations(ViewPropertyAnnotation)) {
        annotation.apply(query, (this as any)[prop.name]);
      }
    }
    return query;
  }

  private async onDocumentChanged(doc: any) {
    const query = new mingo.Query(this.query().selector);

    if (query.test(doc)) {
      return this.refresh();
    }
  }
}
