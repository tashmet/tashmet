import {EventEmitter} from 'eventemitter3';
import {Collection} from '@ziqquratu/database';
import {Query, Range} from './query';

class ViewQuery<T> extends Query {
  public constructor(private view: View<T>, collection: Collection<T>) {
    super(collection);
  }

  protected get target() {
    return this.view;
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
export abstract class View<T> extends EventEmitter implements Range {
  protected _data: T;
  protected query: Query;
  public offset = 0;
  public limit: number | undefined;

  public constructor(public readonly collection: Collection<T>) {
    super();
    this.query = new ViewQuery(this, collection);
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

  private async onDocumentChanged(doc: any) {
    if (this.query.selector.test(doc)) {
      return this.refresh();
    }
  }
}
