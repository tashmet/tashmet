import {provider} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, MemoryCollectionConfig, QueryOptions,
  Sorting, SortingOrder} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {map} from 'lodash';
import * as loki from 'lokijs';
import * as Promise from 'bluebird';

@provider({
  for: 'isimud.MemoryCollectionFactory',
  singleton: true
})
export class MemoryCollectionFactory implements CollectionFactory<MemoryCollectionConfig> {
  private db: any = new loki('local');

  public createCollection(name: string, config: MemoryCollectionConfig): Collection {
    return new MemoryCollection(
      this.db.addCollection(name, config), name
    );
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
          let sort = map(options.sort, function(s: Sorting) {
            return [s.key, s.order === SortingOrder.Descending];
          });
          rset = rset.compoundsort(sort);
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

  public count(selector?: Object): Promise<number> {
    return this.find(selector).then((result: any[]) => {
      return result.length;
    });
  }

  public name(): string {
    return this._name;
  }
}
