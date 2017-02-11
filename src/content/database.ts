import {inject, service} from '@samizdatjs/tiamat';
import {Provider, Activator} from '@samizdatjs/tiamat';
import {Cache, Collection, Database} from './interfaces';
import {CollectionController} from './collection';
import {DocumentController} from './document';
import {EventEmitter} from 'events';

@service({
  name: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter
  implements Database, Activator<any>
{
  private collections: {[name: string]: Collection} = {};
  private _loader: any;

  @inject('tashmetu.Cache') private cache: Cache;
  @inject('tiamat.Provider') private provider: Provider;

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public loader(fn: (done: () => void) => void): void {
    this._loader = fn;
  }

  public start(): void {
    this._loader(() => {
      this.emit('ready');
    });
  }

  public activate(controller: any): any {
    if (controller instanceof CollectionController) {
      return this.activateCollection(controller);
    } else if (controller instanceof DocumentController) {
      return this.activateDocument(controller);
    }
  }

  private activateCollection(controller: CollectionController): CollectionController {
    let name = this.getName(controller);
    let collection = this.cache.createCollection(name);
    controller.setCache(collection);

    controller.on('document-added', (doc: any) => {
      this.emit('document-added', doc, controller);
    });
    controller.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc, controller);
    });
    controller.on('document-changed', (doc: any) => {
      this.emit('document-changed', doc, controller);
    });
    controller.on('document-error', (err: any) => {
      this.emit('document-error', err, controller);
    });

    this.collections[name] = controller;
    return controller;
  }

  private activateDocument(controller: any): any {
    let meta = Reflect.getOwnMetadata('tashmetu:document', controller.constructor);
    let collection = this.provider.get<CollectionController>(meta.collection);
    controller.setCollection(collection);
    collection.addDocumentController(controller);
    return controller;
  }

  private getName(controller: CollectionController): string {
    return Reflect.getOwnMetadata('tashmetu:collection', controller.constructor).name;
  }
}
