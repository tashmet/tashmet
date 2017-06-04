import {inject, provider, activate} from '@samizdatjs/tiamat';
import {Injector} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, View, CacheEvaluator, QueryOptions} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';
import {find, reject, transform} from 'lodash';
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

export abstract class DynamicViewBase extends EventEmitter {
  protected triggered = false;
  protected updating = false;

  public constructor(
    protected collection: Collection,
    protected selector: any
  ) {
    super();

    collection.on('document-upserted', (doc: any) => {
      if (this.triggered && !this.updating) {
        this.updating = true;
        this.onUpdate(doc).then(() => {
          this.updating = false;
          this.triggered = true;
        });
      }
    });
    collection.on('document-removed', (doc: any) => {
      if (this.triggered && !this.updating) {
        this.updating = true;
        this.onUpdate(doc).then(() => {
          this.updating = false;
          this.triggered = true;
        });
      }
    });
  }

  public refresh(): View {
    this.updating = true;
    this.onUpdate();
    return this;
  }

  public applySelector(selector: any): void {
    this.selector = selector;
    this.refresh();
  }

  protected abstract onUpdate(doc?: any): Promise<any>;
}

export class DynamicView extends DynamicViewBase implements View {
  public constructor(
    collection: Collection,
    selector: any,
    private options: any
  ) {
    super(collection, selector);
  }

  protected onUpdate(doc?: any): Promise<any> {
    let self = this;
    return this.collection.find(this.selector, this.options)
      .then((result: any) => {
        if (!doc || find(result, ['_id', doc._id])) {
          self.emit('data-updated', result);
        }
      });
  }
}

export class DynamicDocumentView extends DynamicViewBase implements View {
  public constructor(
    collection: Collection,
    selector: any
  ) {
    super(collection, selector);
  }

  protected onUpdate(doc?: any): Promise<any> {
    let self = this;
    return this.collection.findOne(this.selector)
      .then((result: any) => {
        self.emit('data-updated', result);
      })
      .catch((err: any) => {
        return;
      });
  }
}

@provider({
  for: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: Collection} = {};
  private syncedCount = 0;

  @inject('tashmetu.DatabaseConfig') private dbConfig: DatabaseConfig;
  @inject('tashmetu.LocalDatabase') private localDB: LocalDatabase;
  @inject('tashmetu.RemoteDatabase') private remoteDB: RemoteDatabase;
  @inject('tashmetu.RoutineAggregator') private routineAggregator: RoutineAggregator;
  @inject('tiamat.Injector') private injector: Injector;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public createView(collection: string, selector?: any, options?: any): View {
    return new DynamicView(this.collections[collection], selector, options);
  }

  public createDocumentView(collection: string, selector?: any): View {
    return new DynamicDocumentView(this.collections[collection], selector);
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
