import {EventEmitter} from 'eventemitter3';
import {Collection} from '@ziqquratu/database';
import {makeSelector, Query} from './query';

/**
 * A view representing a subset of documents within a collection.
 *
 * This class can be extended in order to create a view that tracks documents in a collection
 * based on one or more filters. Filters can be added as members on the view. When the view is
 * refreshed (either manually by calling refresh() or as a consequence of one of its filters
 * having been changed) a selector object and query options are passed through each filter and
 * finally used to query the collection.
 */
export abstract class View<T> extends EventEmitter implements Query {
  public skip = 0;
  public limit: number | undefined;

  public constructor(protected readonly collection: Promise<Collection<T>>) {
    super();
    collection.then(collection => {
      collection.on('document-upserted', (doc: T) => {
        this.onDocumentChanged(doc);
      });
      collection.on('document-removed', (doc: T) => {
        this.onDocumentChanged(doc);
      });
      return collection;
    })
  }

  /**
   * Manually trigger a refresh of the view.
   */
  public abstract refresh(): Promise<T | T[] | null>;

  private async onDocumentChanged(doc: T) {
    if (makeSelector(this).test(doc)) {
      return this.refresh();
    }
  }
}
