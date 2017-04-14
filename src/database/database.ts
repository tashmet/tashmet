import {inject, provider, activate} from '@samizdatjs/tiamat';
import {Injector} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database, DatabaseConfig,
  CollectionMapping} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';

@provider({
  for: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter implements Database
{
  private collections: {[name: string]: Collection} = {};
  private syncedCount = 0;

  public constructor(
    @inject('tashmetu.DatabaseConfig') private dbConfig: DatabaseConfig,
    @inject('tashmetu.LocalDatabase') private localDB: LocalDatabase,
    @inject('tashmetu.RemoteDatabase') private remoteDB: RemoteDatabase,
    @inject('tashmetu.RoutineAggregator') private routineAggregator: RoutineAggregator,
    @inject('tiamat.Injector') private injector: Injector
  ) {
    super();
    dbConfig.mappings.forEach((mapping: CollectionMapping) => {
      this.collections[mapping.name] = this.createCollectionController(mapping);
    });
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  @activate('tashmetu.Document')
  private activateDocumentController(document: DocumentController): DocumentController {
    let meta = Reflect.getOwnMetadata('tashmetu:document', document.constructor);
    let collection = this.injector.get<CollectionController>(meta.collection);
    collection.addDocumentController(document);
    document.setCollection(collection);
    return document;
  }

  private createCollectionController(mapping: CollectionMapping): CollectionController {
    let source: Collection;
    if (typeof mapping.source === 'string') {
      source = this.injector.get<Collection>(mapping.source);
    } else {
      source = mapping.source(this.injector);
    }
    let controller = this.injector.get<CollectionController>(mapping.name);
    let collection = this.localDB.createCollection(mapping.name);
    let buffer = this.localDB.createCollection(mapping.name + ':buffer');
    let routines = this.routineAggregator.getRoutines(controller);
    controller.setCache(collection);
    controller.setBuffer(buffer);
    controller.setSource(source);
    routines.forEach((routine: any) => {
      routine.setController(controller);
      controller.addRoutine(routine);
    });

    if (this.isServer()) {
      controller.populate();
    }

    controller.on('ready', () => {
      this.syncedCount += 1;
      if (this.syncedCount === Object.keys(this.collections).length) {
        this.emit('database-synced');
      }
    });

    controller.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc, controller);
    });
    controller.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, controller);
    });
    controller.on('document-error', (err: any) => {
      this.emit('document-error', err, controller);
    });
    return controller;
  }

  private isServer() {
     return ! (typeof window !== 'undefined' && window.document);
  }
}
