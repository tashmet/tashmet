import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import {Annotation} from '@ziggurat/tiamat';
import {Collection, QueryOptions} from '../interfaces';

export class ViewPropertyAnnotation extends Annotation {
  public constructor(
    private modifier: QueryModifier<any>,
    private propName: string,
  ) {
    super();
  }

  public apply(view: View<any>): void {
    this.modifier.modifySelector((view as any)[this.propName], view.selector);
    this.modifier.modifyOptions((view as any)[this.propName], view.options);
  }
}

export abstract class QueryModifier<T> {
  public modifySelector(value: T, selector: any) {
    return;
  }

  public modifyOptions(value: T, options: QueryOptions) {
    return;
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
  /** The current selector */
  public selector: any = {};

  /** The current query options */
  public options: QueryOptions = {};

  protected _data: T;

  constructor(public readonly collection: Collection) {
    super();
    collection.on('document-upserted', (doc: any) => {
      this.onDocumentChanged(doc);
    });
    collection.on('document-removed', (doc: any) => {
      this.onDocumentChanged(doc);
    });
  }

  /**
   * The list of documents in this view.
   */
  public get data(): T {
    return this._data;
  }

  /**
   * Manually trigger a refresh of the view.
   *
   * This function applies all the filters and updates the list of documents.
   *
   * @returns A promise for the list of matching documents.
   * @emits data-updated
   */
  public abstract refresh(): Promise<T>;

  protected compileQuery() {
    this.selector = {};
    this.options = {};

    for (let f of ViewPropertyAnnotation.onClass(this.constructor)) {
      f.apply(this);
    }
  }

  private async onDocumentChanged(doc: any) {
    const query = new mingo.Query(this.selector);

    if (query.test(doc)) {
      return this.refresh();
    }
  }
}
