import {Collection, CollectionFactory, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import ObjectID from 'bson-objectid';

export class MemoryCollection extends EventEmitter implements Collection {
  private collection: any[] = [];

  public constructor(public readonly name: string) {
    super();
  }

  public async find(selector: object = {}, options: QueryOptions = {}): Promise<any[]> {
    return this.cursor(selector, options).all();
  }

  public async findOne(selector: object): Promise<any> {
    const result = await this.find(selector);
    if (result.length > 0) {
      return result[0];
    } else {
      throw new Error('Failed to find document in collection');
    }
  }

  public upsert(obj: any): Promise<any> {
    if (!obj.hasOwnProperty('_id')) {
      obj._id = new ObjectID().toHexString();
      this.collection.push(obj);
    } else {
      const index = this.collection.findIndex(o => o._id === obj._id);
      if (index >= 0) {
        this.collection[index] = obj;
      } else {
        this.collection.push(obj);
      }
    }
    this.emit('document-upserted', obj);
    return Promise.resolve(obj);
  }

  public async remove(selector: object): Promise<any[]> {
    const affected = await this.find(selector);
    const ids = affected.map(doc => doc._id);
    this.collection = this.collection.filter(doc => ids.indexOf(doc._id) === -1);
    for (const doc of affected) {
      this.emit('document-removed', doc);
    }
    return affected;
  }

  public async count(selector?: object): Promise<number> {
    return this.cursor(selector).count();
  }

  public cursor(selector: object = {}, options: QueryOptions = {}): mingo.Cursor<any> {
    let cursor = mingo.find(this.collection, selector);

    if (options.sort) {
      cursor = cursor.sort(options.sort);
    }
    if (options.offset) {
      cursor = cursor.skip(options.offset);
    }
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }
    return cursor;
  }
}

export class MemoryCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private docs: T[] = []) {
    super();
  }

  public create(name: string) {
    const collection = new MemoryCollection(name);

    for (const doc of this.docs) {
      collection.upsert(doc);
    }
    return collection;
  }
}

export function memory<T = any>(docs: T[] = []) {
  return new MemoryCollectionFactory(docs);
}
