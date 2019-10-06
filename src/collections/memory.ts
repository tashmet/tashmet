import {Container} from '@ziggurat/tiamat';
import {Collection, CollectionProducer, QueryOptions, SortingOrder} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';

export function inline<T = any>(docs: T[]): CollectionProducer {
  return (container: Container, name: string): Collection => {
    let collection = new MemoryCollection(name);

    for (let doc of docs) {
      collection.upsert(doc);
    }
    return collection;
  };
}

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
    const index = this.collection.findIndex(o => o._id === obj._id);
    if (index >= 0) {
      this.collection[index] = obj;
    } else {
      this.collection.push(obj);
    }
    this.emit('document-upserted', obj);
    return Promise.resolve(obj);
  }

  public async remove(selector: object): Promise<any[]> {
    let affected = await this.find(selector);
    this.collection = this.collection.filter(obj => affected.findIndex(o => o._id !== obj._id));
    for (let doc of affected) {
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
      const sort: any = {};
      for (let s of options.sort) {
        sort[s.key] = s.order === SortingOrder.Ascending ? 1 : -1;
      }
      cursor = cursor.sort(sort);
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
