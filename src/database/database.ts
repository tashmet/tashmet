import {inject, provider, activate} from '@ziggurat/tiamat';
import {Injector} from '@ziggurat/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, View, Filter, CacheEvaluator, QueryOptions} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from 'eventemitter3';
import {DocumentIdEvaluator} from './cache/documentId';
import {QueryHashEvaluator} from './cache/queryHash';
import {RangeEvaluator} from './cache/range';
import {DynamicView, DynamicViewManager} from './view';
import {each, transform} from 'lodash';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: CollectionController} = {};
  private viewManagers: {[name: string]: DynamicViewManager} = {};
  private syncedCount = 0;

  @inject('isimud.DatabaseConfig') private dbConfig: DatabaseConfig;
  @inject('isimud.LocalDatabase') private localDB: LocalDatabase;
  @inject('isimud.RemoteDatabase') private remoteDB: RemoteDatabase;
  @inject('isimud.RoutineAggregator') private routineAggregator: RoutineAggregator;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public view(name: string, collection: string, filters?: Filter[]): View {
    return this.viewManagers[collection].getView(name, filters || []);
  }

  @activate('isimud.Document')
  private activateDocumentController(document: DocumentController): DocumentController {
    let meta = Reflect.getOwnMetadata('isimud:document', document.constructor);
    let collection = this.injector.get<CollectionController>(meta.collection);
    collection.addDocumentController(document);
    document.setCollection(collection);
    return document;
  }

  @activate('isimud.Collection')
  private activateCollectionController(collection: CollectionController): CollectionController {
    let providerMeta = Reflect.getOwnMetadata('tiamat:provider', collection.constructor);
    let meta = Reflect.getOwnMetadata('isimud:collection', collection.constructor);

    this.collections[meta.name] = collection;
    each(this.dbConfig.sources, (fact: Function, colName: string) => {
      if (colName === providerMeta.for) {
        collection.setSource(fact(this.injector));
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
    collection.addCacheEvaluator(new DocumentIdEvaluator());
    collection.addCacheEvaluator(new RangeEvaluator());
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
