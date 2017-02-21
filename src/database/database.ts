import {inject, service} from '@samizdatjs/tiamat';
import {Provider, Activator} from '@samizdatjs/tiamat';
import {Cache, Collection, Database} from '../interfaces';
import {CollectionController} from '../controllers/collection';
import {DocumentController} from '../controllers/document';
import {EventEmitter} from '../util';

@service({
  name: 'tashmetu.Database',
  singleton: true
})
export class DatabaseService extends EventEmitter
  implements Database, Activator<any>
{
  private collections: {[name: string]: Collection} = {};

  public constructor(
    @inject('tashmetu.Cache') private cache: Cache,
    @inject('tashmetu.Remote') private remote: Cache,
    @inject('tiamat.Provider') private provider: Provider
  ) {
    super();
  }

  public collection(name: string): Collection {
    return this.collections[name];
  }

  public activate(config: any): any {
    let meta = Reflect.getOwnMetadata('tashmetu:content', config.constructor);
    Object.keys(meta).forEach((name: string) => {
      let ctrlConfig = meta[name];
      let colCtrl = this.activateCollectionController(name, ctrlConfig);
      ctrlConfig.documents = ctrlConfig.documents || [];

      ctrlConfig.documents.forEach((docName: string) => {
        let docCtrl = this.provider.get<DocumentController>(docName);
        docCtrl.setCollection(colCtrl);
        colCtrl.addDocumentController(docCtrl);
      });
    });
  }

  private activateCollectionController(name: string, config: any): CollectionController {
    let source: Collection;
    if (this.isServer()) {
      source = this.provider.get<Collection>(config.source);
    } else {
      source = this.remote.createCollection(name);
    }
    let controller = this.provider.get<CollectionController>(name);
    let collection = this.cache.createCollection(name);
    let buffer = this.cache.createCollection(name + ':buffer');
    controller.setCache(collection);
    controller.setBuffer(buffer);
    controller.setSource(source);
    this.collections[name] = controller;

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
