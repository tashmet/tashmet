import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  Collection,
  CollectionFactory,
  Cursor,
  Filter,
  ReplaceOneOptions,
  QueryOptions,
  SortingKey,
  SortingDirection,
  Database,
  AggregationPipeline,
} from '../interfaces';
import {applyQueryOptions, sortingMap} from '../cursor';
import {aggregate} from '../aggregation';
import {withAutoEvent} from '../middleware';

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
    private filter: Filter<T>,
    options: QueryOptions,
  ) {
    this.cursor = new MingoQuery(filter).find(collection, options.projection);
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
      : new MingoQuery(this.filter).find(this.collection).count();
  }
}

export class MemoryCollection<T = any> extends Collection<T> {
  public static fromConfig<T = any>(name: string, database: Database, config: MemoryCollectionConfig) {
    const instance = new MemoryCollection<T>(name, database, config.documents || []);

    return config.disableEvents
      ? instance
      : withAutoEvent(instance)
  }

  public constructor(
    public readonly name: string,
    protected database: Database,
    protected documents: any[] = [],
  ) {
    super();
  }

  public toString(): string {
    return `memory collection '${this.name}' (${this.documents.length} documents)`;
  }

  public aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    return aggregate(pipeline, this.documents, this.database);
  }

  public find(filter: Filter<T> = {}, options: QueryOptions<T> = {}): Cursor<T> {
    return new MemoryCollectionCursor<T>(this.documents, filter, options);
  }

  public async findOne(filter: Filter<T>): Promise<T | null> {
    const result = await this.find(filter).limit(1).toArray();
    return result.length > 0 ? result[0] : null;
  }

  public async insertOne(doc: any): Promise<T> {
    if (!doc.hasOwnProperty('_id')) {
      doc._id = new ObjectID().toHexString();
      this.documents.push(doc);
    } else {
      const index = this.documents.findIndex(o => o._id === doc._id);
      if (index >= 0) {
        throw new Error(
          `Insertion failed: A document with ID '${doc._id}' already exists in '${this.name}'`
        );
      } else {
        this.documents.push(doc);
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

  public async replaceOne(filter: Filter<T>, doc: any, options: ReplaceOneOptions = {}): Promise<T | null> {
    const old = new MingoQuery(filter as any).find(this.documents).next() as any;
    if (old) {
      const index = this.documents.findIndex(o => o._id === old._id);
      return this.documents[index] = Object.assign({}, {_id: old._id}, doc);
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public async deleteOne(filter: Filter<T>): Promise<T> {
    const affected = await this.findOne(filter) as any;
    if (affected) {
      this.documents = this.documents.filter(doc => doc._id !== affected._id);
    }
    return affected;
  }

  public async deleteMany(filter: Filter<T>): Promise<T[]> {
    const affected = await this.find(filter).toArray() as any[];
    const ids = affected.map(doc => doc._id);
    this.documents = this.documents.filter(doc => ids.indexOf(doc._id) === -1);
    return affected;
  }
}

export class MemoryCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private config: MemoryCollectionConfig) {
    super();
  }

  public async create(name: string, database: Database) {
    return MemoryCollection.fromConfig<T>(name, database, this.config);
  }
}

export function memory<T = any>(config: MemoryCollectionConfig<T> = {}) {
  return new MemoryCollectionFactory(config);
}
