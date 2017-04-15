import {LocalDatabase, Collection, QueryOptions} from '../interfaces';
import {provider} from '@samizdatjs/tiamat';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';

@provider({
  for: 'tashmetu.LocalDatabase',
  singleton: true
})
export class LocalDB implements LocalDatabase {
  private db: any = new loki('local');
  private collections: {[index: string]: Collection} = {};

  public createCollection(name: string): Collection {
    let collection = new MemoryCollection(this.db.addCollection(name, {indices: '_id'}), name);
    this.collections[name] = collection;
    return collection;
  }
}

class MemoryCollection extends EventEmitter implements Collection {
  public constructor(private collection: any, private _name: string) {
    super();
  }

  // TODO: Implement support for the query options.
  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    return Promise.resolve(this.collection.find(selector || {}));
  }

  public findOne(selector: Object): Promise<any> {
    return Promise.resolve(this.collection.findOne(selector));
  }

  public upsert(obj: any): Promise<any> {
    obj._collection = this._name;
    let existing = this.collection.findOne({_id: obj._id});

    if (existing) {
      obj.$loki = existing.$loki;
      obj.meta = existing.meta;
      this.collection.update(obj);
    } else {
      delete obj.$loki;
      this.collection.insert(obj);
    }
    this.emit('document-upserted', obj);
    return Promise.resolve(obj);
  }

  public name(): string {
    return this._name;
  }
}
