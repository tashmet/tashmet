import {inject, provider, activate} from '@samizdatjs/tiamat';
import {Injector} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping, View} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';
import {find, transform} from 'lodash';

export abstract class DynamicViewBase extends EventEmitter {
  protected triggered = false;

  public constructor(
    protected collection: Collection,
    protected selector: any
  ) {
    super();

    collection.on('document-upserted', (doc: any) => {
      if (this.triggered) {
        this.onUpdate(doc);
      }
    });
    collection.on('document-removed', (doc: any) => {
      if (this.triggered) {
        this.onUpdate(doc);
      }
    });
  }

  public refresh(): View {
    this.onUpdate();
    return this;
  }

  public applySelector(selector: any): void {
    this.selector = selector;
    this.refresh();
  }

  protected abstract onUpdate(doc?: any): void;
}

export class DynamicView extends DynamicViewBase implements View {
  public constructor(
    collection: Collection,
    selector: any,
    private options: any
  ) {
    super(collection, selector);
  }

  protected onUpdate(doc?: any): void {
    let self = this;
    this.collection.find(this.selector, this.options).then(function(result) {
      self.triggered = true;
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

  protected onUpdate(doc?: any): void {
    let self = this;
    this.collection.findOne(this.selector).then(function(result) {
      self.triggered = true;
      self.emit('data-updated', result);
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
