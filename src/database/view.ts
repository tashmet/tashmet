import {View, QueryOptions, Filter} from '../interfaces';
import {EventEmitter} from '../util';
import {CollectionController} from '../controllers/collection';
import {find, values} from 'lodash';
import * as Promise from 'bluebird';

export class DynamicView extends EventEmitter implements View {
  public selector: any = {};
  public options: QueryOptions = {};
  public data: any[] = [];

  public constructor(
    public name: string,
    private filters: Filter[]
  ) {
    super();

    filters.forEach((filter: Filter) => {
      filter.setView(this);
      filter.on('filter-changed', () => {
        this.refresh();
      });
    });

    this.on('data-updated', (results: any[], totalCount: number) => {
      this.data = results;
    });
  }

  public refresh(): View {
    this.selector = {};
    this.options = {};

    this.filters.forEach((f: Filter) => {
      f.apply(this.selector, this.options);
    });
    this.emit('refresh');
    return this;
  }
}

export class DynamicViewManager {
  private views: {[name: string]: DynamicView} = {};

  public constructor(private collection: CollectionController) {
    collection.on('document-upserted', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
    collection.on('document-removed', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
  }

  public getView(name: string, filters: Filter[]): View {
    if (!this.views[name]) {
      let view = new DynamicView(name, filters);
      view.on('refresh', () => {
        this.collection.find(view.selector, view.options)
          .then((results: any[]) => {
            this.collection.count(view.selector).then((totalCount: number) => {
              view.emit('data-updated', results, totalCount);
            });
          });
      });
      this.views[name] = view;
      view.refresh();
    }
    return this.views[name];
  }

  private onDocumentUpdated(doc: any) {
    Promise.each(values(this.views), (view: DynamicView) => {
      return this.collection.cache.find(view.selector, view.options)
        .then((documents: any[]) => {
          if (find(documents, ['_id', doc._id])) {
            view.emit('data-updated', documents);
          }
        });
    });
  }
}
