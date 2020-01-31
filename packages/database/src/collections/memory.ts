import {Collection, CollectionFactory, Cursor, SortingOrder} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import ObjectID from 'bson-objectid';

export class MemoryCollectionCursor<T> implements Cursor<T> {
  public constructor(
    private cursor: mingo.Cursor<T>,
    private selCursor: mingo.Cursor<T>
  ) {}

  public sort(key: string, order: SortingOrder): Cursor<T> {
    this.cursor.sort({[key]: order});
    return this;
  }

  public skip(count: number): Cursor<T> {
    this.cursor.skip(count);
    return this;
  }

  public limit(count: number): Cursor<T> {
    this.cursor.limit(count);
    return this;
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.all();
  }

  public async count(applySkipLimit = false): Promise<number> {
    return applySkipLimit ? this.cursor.count() : this.selCursor.count();
  }
}

export class MemoryCollection<U = any> extends EventEmitter implements Collection<U> {
  private collection: any[] = [];

  public constructor(public readonly name: string) {
    super();
  }

  public toString(): string {
    return `memory collection '${this.name}' (${this.collection.length} documents)`;
  }

  public find<T extends U = any>(selector: object = {}): Cursor<T> {
    return new MemoryCollectionCursor<T>(
      mingo.find(this.collection, selector),
      mingo.find(this.collection, selector)
    );
  }

  public async findOne(selector: object): Promise<any> {
    const result = await this.find(selector).limit(1).toArray();
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

  public async delete(selector: object): Promise<any[]> {
    const affected = await this.find(selector).toArray();
    const ids = affected.map(doc => doc._id);
    this.collection = this.collection.filter(doc => ids.indexOf(doc._id) === -1);
    for (const doc of affected) {
      this.emit('document-removed', doc);
    }
    return affected;
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
