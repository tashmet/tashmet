import {
  Collection,
  CollectionFactory,
  Cursor,
  ReplaceOneOptions,
  QueryOptions,
  SortingKey,
  SortingDirection,
  Database,
  AggregationPipeline,
} from '../interfaces';
import {AggregationCursor, applyQueryOptions, sortingMap} from '../cursor';
import {EventEmitter} from 'eventemitter3';
import mingo from 'mingo';
import ObjectID from 'bson-objectid';

export interface MemoryCollectionConfig<T = any> {
  /**
   * A list of documents this collection should operate on.
   *
   * If not provided an empty list will be created.
   */
  documents?: T[];

  /** If set to true, no events will be emitted when operations are run on the collection. */
  disableEvents?: boolean;
}

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
    return applySkipLimit
      ? this.cursor.count()
      : mingo.find(this.collection, this.selector).count();
  }
}

export class MemoryCollection<T = any> extends EventEmitter implements Collection<T> {
  private collection: any[];

  public constructor(
    public readonly name: string,
    protected database: Database,
    protected config: MemoryCollectionConfig = {}
  ) {
    super();
    this.collection = config.documents || [];
  }

  public toString(): string {
    return `memory collection '${this.name}' (${this.collection.length} documents)`;
  }

  public aggregate<U>(pipeline: AggregationPipeline): Cursor<U> {
    return new AggregationCursor<U>(pipeline, this.collection, this.database);
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
    if (!this.config.disableEvents) {
      this.emit('document-upserted', doc);
    }
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
      if (!this.config.disableEvents) {
        this.emit('document-upserted', this.collection[index]);
      }
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
      if (!this.config.disableEvents) {
        this.emit('document-removed', affected);
      }
    }
    return affected;
  }

  public async deleteMany(selector: object): Promise<T[]> {
    const affected = await this.find(selector).toArray() as any[];
    const ids = affected.map(doc => doc._id);
    this.collection = this.collection.filter(doc => ids.indexOf(doc._id) === -1);
    if (!this.config.disableEvents) {
      for (const doc of affected) {
        this.emit('document-removed', doc);
      }
    }
    return affected;
  }
}

export class MemoryCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private config: MemoryCollectionConfig) {
    super();
  }

  public async create(name: string, database: Database) {
    return new MemoryCollection<T>(name, database, this.config);
  }
}

export function memory<T = any>(config: MemoryCollectionConfig<T> = {}) {
  return new MemoryCollectionFactory(config);
}
