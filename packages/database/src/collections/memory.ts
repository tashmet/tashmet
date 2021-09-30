import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  CollectionFactory,
  Cursor,
  ReplaceOneOptions,
  QueryOptions,
  SortingKey,
  SortingDirection,
  Database,
  AggregationPipeline,
} from '../interfaces';
import {applyQueryOptions, sortingMap} from '../cursor';
import {aggregate} from '../aggregation';
import {AutoEventCollection} from './autoEvent';

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
  private cursor: mingoCursor.Cursor;

  public constructor(
    private collection: any[],
    private selector: any,
    options: QueryOptions,
  ) {
    this.cursor = new MingoQuery(selector).find(collection, options.projection);
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
    return this.cursor.next() as any || null;
  }

  public async hasNext(): Promise<boolean> {
    return this.cursor.hasNext();
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return this.cursor.forEach(iterator);
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.all() as any;
  }

  public async count(applySkipLimit = true): Promise<number> {
    return applySkipLimit
      ? this.cursor.count()
      : new MingoQuery(this.selector).find(this.collection).count();
  }
}

export class MemoryCollection<T = any> extends AutoEventCollection<T> {
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

  public aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    return aggregate(pipeline, this.collection, this.database);
  }

  public find(selector: object = {}, options: QueryOptions<T> = {}): Cursor<T> {
    return new MemoryCollectionCursor<T>(this.collection, selector, options);
  }

  public async findOne(selector: object): Promise<T | null> {
    const result = await this.find(selector).limit(1).toArray();
    return result.length > 0 ? result[0] : null;
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
    const old = new MingoQuery(selector as any).find(this.collection).next() as any;
    if (old) {
      const index = this.collection.findIndex(o => o._id === old._id);
      return this.collection[index] = Object.assign({}, {_id: old._id}, doc);
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public async deleteOne(selector: object): Promise<T> {
    const affected = await this.findOne(selector) as any;
    if (affected) {
      this.collection = this.collection.filter(doc => doc._id !== affected._id);
    }
    return affected;
  }

  public async deleteMany(selector: object): Promise<T[]> {
    const affected = await this.find(selector).toArray() as any[];
    const ids = affected.map(doc => doc._id);
    this.collection = this.collection.filter(doc => ids.indexOf(doc._id) === -1);
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
