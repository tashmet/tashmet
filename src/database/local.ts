import {LocalDatabase, Collection} from '../interfaces';
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

  public find(selector: Object, options: Object, fn: (result: any) => void): void {
    fn(this.collection.find(selector));
  }

  public findOne(selector: Object, options: Object, fn: (result: any) => void): void {
    fn(this.collection.findOne(selector));
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
