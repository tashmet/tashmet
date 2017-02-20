import {Cache, Collection} from '../interfaces';
import {service} from '@samizdatjs/tiamat';
import {EventEmitter} from 'events';

let minimongo = require('minimongo');
let LocalDb = minimongo.MemoryDb;

@service({
  name: 'tashmetu.Cache',
  singleton: true
})
export class MinimongoCache implements Cache {
  private db: any = new LocalDb();
  private collections: {[index: string]: Collection} = {};

  public createCollection(name: string): Collection {
    this.db.addCollection(name);
    let collection = new MinimongoCollection(this.db[name], name);
    this.collections[name] = collection;
    return collection;
  }

  public getCollection(name: string): Collection {
    return this.collections[name];
  }
}

class MinimongoCollection extends EventEmitter implements Collection {
  public constructor(private collection: any, private _name: string) {
    super();
  }

  public find(filter: Object, options: Object, fn: (result: any) => void): void {
    this.collection.find(filter, options).fetch(fn);
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    this.collection.findOne(filter, options, fn);
  }

  public upsert(obj: any, fn: () => void): void {
    obj._collection = this._name;
    this.collection.upsert(obj, () => {
      this.emit('document-upserted', obj);
      fn();
    });
  }

  public name(): string {
    return this._name;
  }
}
