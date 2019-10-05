import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {FilterConfig} from './interfaces';

/**
 * Base class for filters.
 *
 * Extend this class to create a filter that can be used in a view to limit results.
 */
export abstract class Filter {
  /** True if filter has changed since last update */
  public dirty = false;

  public observe: string[];

  public constructor(config: FilterConfig) {
    this.observe = config.observe || [];
  }

  /**
   * Apply the filter to the given query.
   *
   * This function is called every time the view is refreshed.
   * Override it to make modifications to the selector and query options.
   */
  public apply(selector: object, options: QueryOptions): void { return; }

  public attach(view: View) { return; }
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
export class View<T = any> extends EventEmitter {
  private _selector: any = {};
  private _options: QueryOptions = {};
  private _data: T[] = [];
  private filters: Filter[] = [];

  constructor(public readonly collection: Collection) {
    super();
    this.on('data-updated', (results: T[]) => {
      this._data = results;
    });

    collection.on('document-upserted', (doc: any) => {
      this.documentUpdated(doc);
    });
    collection.on('document-removed', (doc: any) => {
      this.documentUpdated(doc);
    });
  }

  public filter<F extends Filter>(filter: F): F {
    filter.attach(this);
    let proxy = new Proxy(filter, {
      set: (target: any, key: PropertyKey, value: any, reciever: any): boolean => {
        let toggleDirty = key === 'dirty' && value === true && !filter.dirty;
        target[key] = value;
        if (toggleDirty || filter.observe.indexOf(<string>key) > 0) {
          this.refresh();
        }
        return true;
      }
    });
    this.filters.push(proxy);
    this.applyFilters();
    return proxy;
  }

  /** The current selector */
  public get selector(): any {
    return this._selector;
  }

  /** The current query options */
  public get options(): QueryOptions {
    return this._options;
  }

  /**
   * The list of documents in this view.
   */
  public get data(): T[] {
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
  public async refresh(): Promise<T[]> {
    this.applyFilters(true);

    let docs = await this.collection.find<T>(this.selector, this.options);
    let totalCount = await this.collection.count(this.selector);
    this.emit('data-updated', docs, totalCount);
    return docs;
  }

  private applyFilters(resetDirty = false) {
    this._selector = {};
    this._options = {};

    for (let f of this.filters) {
      f.apply(this.selector, this.options);
      if (resetDirty) {
        f.dirty = false;
      }
    }
  }

  private async documentUpdated(doc: any) {
    if (doc._collection !== this.collection.name) {
      return;
    }
    this.applyFilters();
    // TODO: This query needs to only be made against cached documents.
    let docs = await this.collection.find(this.selector, this.options);
    if (docs.find(d => d._id === doc._id)) {
      this.emit('data-updated', docs);
    }
  }
}
