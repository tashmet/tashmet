import {
  Collection,
  CollectionFactory,
  Cursor,
  ReplaceOneOptions,
  QueryOptions,
  SortingKey,
  SortingDirection
} from '../interfaces';
import {applyQueryOptions, sortingMap} from '../cursor';
import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import ObjectID from 'bson-objectid';

export class MemoryCollectionCursor<T> implements Cursor<T> {
  private cursor: mingo.Cursor<T>;

  public constructor(
    private collection: any[],
    private selector: any,
    options: QueryOptions,
  ) {
    this.cursor = mingo.find(collection, selector);
    applyQueryOptions(this, options);
  }

  public sort(key: SortingKey, direction?: SortingDirection): Cursor<T> {
    this.cursor.sort(sortingMap(key, direction));
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

  public async next(): Promise<T | null> {
    return this.cursor.next() || null;
  }
  
  public async hasNext(): Promise<boolean> {
    return this.cursor.hasNext();
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return this.cursor.forEach(iterator);
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.all();
  }

  public async count(applySkipLimit = true): Promise<number> {
    return applySkipLimit ? this.cursor.count() : mingo.find(this.collection, this.selector).count();
  }
}

export class MemoryCollection<T = any> extends EventEmitter implements Collection<T> {
  private collection: any[] = [];

  public constructor(public readonly name: string) {
    super();
  }

  public toString(): string {
    return `memory collection '${this.name}' (${this.collection.length} documents)`;
  }

  public find(selector: object = {}, options: QueryOptions = {}): Cursor<T> {
    return new MemoryCollectionCursor<T>(this.collection, selector, options);
  }

  public async findOne(selector: object): Promise<T | null> {
    const result = await this.find(selector).limit(1).toArray();
    if (result.length > 0) {
      return result[0];
    } else {
      return null;
    }
  }

  public async insertOne(doc: any): Promise<T> {
    if (!doc.hasOwnProperty('_id')) {
      doc._id = new ObjectID().toHexString();
      this.collection.push(doc);
    } else {
      const index = this.collection.findIndex(o => o._id === doc._id);
      if (index >= 0) {
        throw new Error(
          `Insertion failed: A document with ID '${doc._id}' already exists in '${this.name}'`
        );
      } else {
        this.collection.push(doc);
      }
    }
    this.emit('document-upserted', doc);
    return doc;
  }

  public async insertMany(docs: T[]): Promise<T[]> {
    const result: any[] = [];
    for (const doc of docs) {
      result.push(await this.insertOne(doc));
    }
    return result;
  }

  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}): Promise<T | null> {
    const old = mingo.find(this.collection, selector).next();
    if (old) {
      const index = this.collection.findIndex(o => o._id === old._id);
      this.collection[index] = Object.assign({}, {_id: old._id}, doc);
      this.emit('document-upserted', this.collection[index]);
      return this.collection[index];
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public async deleteOne(selector: object): Promise<T> {
    const affected = await this.findOne(selector) as any;
    if (affected) {
      this.collection = this.collection.filter(doc => doc._id !== affected._id);
      this.emit('document-removed', affected);
    }
    return affected;
  }

  public async deleteMany(selector: object): Promise<T[]> {
    const affected = await this.find(selector).toArray() as any[];
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
    const collection = new MemoryCollection<T>(name);
    collection.insertMany(this.docs);
    return collection;
  }
}

export function memory<T = any>(docs: T[] = []) {
  return new MemoryCollectionFactory(docs);
}
