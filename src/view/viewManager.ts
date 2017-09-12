import {ViewConfig, FilterProvider} from './interfaces';
import {View} from './view';
import {Document} from '../models/document';
import {CollectionController} from '../controllers/collection';
import {each, find, values} from 'lodash';
import * as Promise from 'bluebird';

export class ViewManager {
  private views: {[name: string]: View} = {};

  public constructor(private collection: CollectionController) {
    collection.on('document-upserted', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
    collection.on('document-removed', (doc: any) => {
      this.onDocumentUpdated(doc);
    });
  }

  public addView(view: View) {
    let config: ViewConfig = Reflect.getOwnMetadata('isimud:view', view.constructor);
    each(config.filters, (provider: FilterProvider, name: string) => {
      view.addFilter(name, provider);
    });

    view.on('refresh', () => {
      this.collection.find(view.selector, view.options)
        .then((results: Document[]) => {
          this.collection.count(view.selector).then((totalCount: number) => {
            view.emit('data-updated', results, totalCount);
          });
        });
    });
    this.views[config.name] = view;
  }

  public view(name: string): View {
    return this.views[name];
  }

  private onDocumentUpdated(doc: any) {
    Promise.each(values(this.views), (view: View) => {
      return this.collection.cache.find(view.selector, view.options)
        .then((documents: any[]) => {
          if (find(documents, ['_id', doc._id])) {
            view.emit('data-updated', documents, 1);
          }
        });
    });
  }
}
