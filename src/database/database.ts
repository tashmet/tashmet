import {inject, provider, activate} from '@samizdatjs/tiamat';
import {Injector} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, View, CacheEvaluator, QueryOptions} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';
import {QueryHashEvaluator} from './cache/queryHash';
import {DynamicView, DynamicViewManager} from './view';
import {find, reject, transform} from 'lodash';
import * as Promise from 'bluebird';

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
