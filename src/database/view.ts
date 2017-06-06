import {View, QueryOptions} from '../interfaces';
import {EventEmitter} from '../util';
import {CollectionController} from '../controllers/collection';
import {find, values} from 'lodash';
import * as Promise from 'bluebird';

export class DynamicView extends EventEmitter implements View {
  public selector: any = {};
  public options: QueryOptions = {};

  public constructor(
    public name: string
  ) {
    super();
  }

  public applySelector(selector: any): View {
    this.selector = selector;
    return this;
  }

  public applyOptions(options: QueryOptions): View {
    this.options = options;
    return this;
  }

  public refresh(): View {
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

  public getView(name: string): View {
    if (!this.views[name]) {
      let view = new DynamicView(name);
      view.on('refresh', () => {
        this.collection.find(view.selector, view.options)
          .then((results: any[]) => {
            view.emit('data-updated', results);
          });
      });
      this.views[name] = view;
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
