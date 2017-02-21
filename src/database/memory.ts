import {MemoryDatabase, Collection} from '../interfaces';
import {service} from '@samizdatjs/tiamat';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';

@service({
  name: 'tashmetu.MemoryDatabase',
  singleton: true
})
export class MemoryDB implements MemoryDatabase {
  private db: any = new loki('test');
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

  public find(filter: Object, options: Object, fn: (result: any) => void): void {
    fn(this.collection.find(filter, options));
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    this.collection.findOne(filter, options, fn);
  }

  public upsert(obj: any, fn: () => void): void {
    delete obj.$loki;
    obj._collection = this._name;
    this.collection.insert(obj);
    this.emit('document-upserted', obj);
    fn();
  }

  public name(): string {
    return this._name;
  }
}
