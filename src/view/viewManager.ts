import {activate, provider, ProviderConfig} from '@ziggurat/tiamat';
import {ViewConfig, FilterProvider} from './interfaces';
import {View} from './view';
import {Document} from '../models/document';
import {Controller} from '../database/controller';
import {each, find, values} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.ViewManager',
  singleton: true
})
export class ViewManager {
  private views: {[name: string]: View} = {};
  private collections: {[name: string]: Controller} = {};

  public view(name: string): View {
    return this.views[name];
  }

  @activate('isimud.View')
  private activateView(view: View) {
    const config: ViewConfig = Reflect.getOwnMetadata('isimud:view', view.constructor);
    const providerConfig: ProviderConfig = Reflect.getOwnMetadata(
      'tiamat:provider', view.constructor);

    each(config.filters, (fp: FilterProvider, name: string) => {
      view.addFilter(name, fp);
    });

    view.on('refresh', () => {
      let collection = this.collections[config.collection];

      collection.find(view.selector, view.options)
        .then((results: Document[]) => {
          collection.count(view.selector)
            .then((totalCount: number) => {
              view.emit('data-updated', results, totalCount);
            });
        });
    });
    this.views[providerConfig.for] = view;
    return view;
  }

  @activate('isimud.Collection')
  private activateController(collection: Controller): Controller {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    this.collections[providerMeta.for] = collection;

    collection.on('document-upserted', (doc: any) => {
      this.onDocumentUpdated(doc, collection);
    });
    collection.on('document-removed', (doc: any) => {
      this.onDocumentUpdated(doc, collection);
    });

    return collection;
  }

  private onDocumentUpdated(doc: any, collection: Controller) {
    Promise.each(values(this.views), (view: View) => {
      return collection.cache.find(view.selector, view.options)
        .then((documents: any[]) => {
          if (find(documents, ['_id', doc._id])) {
            view.emit('data-updated', documents, 1);
          }
        });
    });
  }
}
