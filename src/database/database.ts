import {inject, provider, activate} from '@samizdatjs/tiamat';
import {Injector} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, View, CacheEvaluator, QueryOptions} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';
import {find, reject, transform, values} from 'lodash';
import * as Promise from 'bluebird';

export class QueryHashEvaluator implements CacheEvaluator {
  private cachedQueries: {[query: string]: any} = {};

  public isCached(selector: any, options: QueryOptions): boolean {
    return this.hash(selector, options) in this.cachedQueries;
  }

  public setCached(selector: any, options: QueryOptions) {
    this.cachedQueries[this.hash(selector, options)] = options;
  }

  public add(doc: any) {
    /*
    this.cachedQueries = reject(this.cachedQueries, (options: QueryOptions) => {
      return Object.keys(options).length > 0;
    });
    */
  }

  private hash(selector: Object, options: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options);
  }
}

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
        this.collection.find(view.selector, view.options).then((results: any[]) => {
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

@provider({
  for: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: CollectionController} = {};
  private viewManagers: {[name: string]: DynamicViewManager} = {};
  private syncedCount = 0;

  @inject('tashmetu.DatabaseConfig') private dbConfig: DatabaseConfig;
  @inject('tashmetu.LocalDatabase') private localDB: LocalDatabase;
  @inject('tashmetu.RemoteDatabase') private remoteDB: RemoteDatabase;
  @inject('tashmetu.RoutineAggregator') private routineAggregator: RoutineAggregator;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public view(name: string, collection: string): View {
    return this.viewManagers[collection].getView(name);
  }

  @activate('tashmetu.Document')
  private activateDocumentController(document: DocumentController): DocumentController {
    let meta = Reflect.getOwnMetadata('tashmetu:document', document.constructor);
    let collection = this.injector.get<CollectionController>(meta.collection);
    collection.addDocumentController(document);
    document.setCollection(collection);
    return document;
  }

  @activate('tashmetu.Collection')
  private activateCollectionController(collection: CollectionController): CollectionController {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    let meta = Reflect.getOwnMetadata('tashmetu:collection', collection.constructor);

    this.collections[meta.name] = collection;
    this.dbConfig.mappings.forEach((mapping: CollectionMapping) => {
      if (mapping.name === providerMeta.for) {
        let source: Collection;
        if (typeof mapping.source === 'string') {
          source = this.injector.get<Collection>(mapping.source);
        } else {
          source = mapping.source(this.injector);
        }
        collection.setSource(source);
      }
    });
    let cache = this.localDB.createCollection(meta.name);
    let buffer = this.localDB.createCollection(meta.name + ':buffer');
    let routines = this.routineAggregator.getRoutines(collection);
    collection.setCache(cache);
    collection.setBuffer(buffer);
    routines.forEach((routine: any) => {
      routine.setController(collection);
      collection.addRoutine(routine);
    });
    collection.addCacheEvaluator(new QueryHashEvaluator());
    this.viewManagers[meta.name] = new DynamicViewManager(collection);

    if (this.isServer()) {
      if (meta.populateAfter.length > 0) {
        let promises = transform(meta.populateAfter, (result, depName: string) => {
          result.push(this.injector.get<CollectionController>(depName).populate());
        });
        Promise.all(promises).then(deps => {
          collection.populate();
        });
      } else {
        collection.populate();
      }
    }

    collection.on('ready', () => {
      this.syncedCount += 1;
      if (this.syncedCount === Object.keys(this.collections).length) {
        this.emit('database-synced');
      }
    });

    collection.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc, collection);
    });
    collection.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, collection);
    });
    collection.on('document-error', (err: any) => {
      this.emit('document-error', err, collection);
    });

    return collection;
  }

  private isServer() {
     return ! (typeof window !== 'undefined' && window.document);
  }
}
