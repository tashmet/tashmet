import {LocalDatabase, Collection, QueryOptions} from '../interfaces';
import {provider} from '@samizdatjs/tiamat';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';
import * as Promise from 'bluebird';

@provider({
  for: 'tashmetu.LocalDatabase',
  singleton: true
})
export class LocalDB implements LocalDatabase {
  private db: any = new loki('local');
  private collections: {[index: string]: Collection} = {};

  public createCollection(name: string): Collection {
    let collection = new MemoryCollection(
      this.db.addCollection(name, {indices: '_id'}), name
    );
    this.collections[name] = collection;
    return collection;
  }
}

class MemoryCollection extends EventEmitter implements Collection {
  public constructor(private collection: any, private _name: string) {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    return new Promise((resolve) => {
      let rset = this.collection.chain().find(selector || {});
      if (options) {
        if (options.sort) {
          rset = rset.compoundsort(options.sort);
        }
        if (options.offset) {
          rset = rset.offset(options.offset);
        }
        if (options.limit) {
          rset = rset.limit(options.limit);
        }
      }
      resolve(rset.data());
    });
  }

  public findOne(selector: Object): Promise<any> {
    return new Promise((resolve, reject) => {
      let obj = this.collection.findOne(selector);
      if (obj) {
        resolve(obj);
      } else {
        reject(new Error('Failed to find document in collection'));
      }
    });
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
