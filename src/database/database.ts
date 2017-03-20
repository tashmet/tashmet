import {inject, provider} from '@samizdatjs/tiamat';
import {Injector, Activator} from '@samizdatjs/tiamat';
import {LocalDatabase, RemoteDatabase, Collection, Database} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {RoutineAggregator} from '../controllers/routine';
import {EventEmitter} from '../util';

@provider({
  for: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter
  implements Database, Activator<any>
{
  private collections: {[name: string]: Collection} = {};

  public constructor(
    @inject('tashmetu.LocalDatabase') private localDB: LocalDatabase,
    @inject('tashmetu.RemoteDatabase') private remoteDB: RemoteDatabase,
    @inject('tashmetu.RoutineAggregator') private routineAggregator: RoutineAggregator,
    @inject('tiamat.Injector') private injector: Injector
  ) {
    super();
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public activate(provider: any): any {
    if (provider instanceof DocumentController) {
      return this.activateDocumentController(provider);
    } else {
      return this.activateConfig(provider);
    }
  }

  private activateConfig(config: any): any {
    let meta = Reflect.getOwnMetadata('tashmetu:config', config.constructor);
    meta.controllers.forEach((ctrlConfig: any) => {
      let colCtrl = this.activateCollectionController(ctrlConfig);
    });
    return config;
  }

  private activateDocumentController(document: DocumentController): DocumentController {
    let meta = Reflect.getOwnMetadata('tashmetu:document', document.constructor);
    let collection = this.injector.get<CollectionController>(meta.collection);
    collection.addDocumentController(document);
    document.setCollection(collection);
    return document;
  }

  private activateCollectionController(config: any): CollectionController {
    let source: Collection;
    if (typeof config.source === 'string') {
      source = this.injector.get<Collection>(config.source);
    } else {
      source = config.source(this.injector);
    }
    let controller = this.injector.get<CollectionController>(config.name);
    let collection = this.localDB.createCollection(config.name);
    let buffer = this.localDB.createCollection(config.name + ':buffer');
    let routines = this.routineAggregator.getRoutines(controller);
    controller.setCache(collection);
    controller.setBuffer(buffer);
    controller.setSource(source);
    routines.forEach((routine: any) => {
      routine.setController(controller);
      controller.addRoutine(routine);
    });
    this.collections[config.name] = controller;

    if (this.isServer()) {
      controller.populate();
    }

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
