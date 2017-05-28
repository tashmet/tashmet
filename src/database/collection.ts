import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from '../util';
import * as Promise from 'bluebird';

export class CollectionBase extends EventEmitter implements Collection {
  protected collection: Collection;

  public setCollection(collection: Collection): void {
    this.collection = collection;

    collection.on('document-upserted', (obj: any) => {
      this.emit('document-upserted', obj);
    });
    collection.on('document-removed', (obj: any) => {
      this.emit('document-removed', obj);
    });
  }

  public find(filter?: Object, options?: QueryOptions): Promise<any> {
    return this.collection.find(filter, options);
  }

  public findOne(filter: Object): Promise<any> {
    return this.collection.findOne(filter);
  }

  public upsert(obj: any): Promise<any> {
    return this.collection.upsert(obj);
  }

  public name(): string {
    return this.collection.name();
  }
}
