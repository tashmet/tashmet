import {Factory} from '@tashmit/core';
import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  CollectionFactory,
  Cursor,
  DeleteResult,
  Document,
  Filter,
  InsertOneResult,
  ReplaceOneOptions,
  UpdateResult,
  QueryOptions,
  SortingKey,
  SortingDirection,
  Database,
  AggregationPipeline,
} from '../interfaces';
import {AbstractCollection} from './base';
import {applyQueryOptions, sortingMap} from '../cursor';
import {aggregate} from '../aggregation';
import {withAutoEvent} from '../middleware';
import {idSet} from '../util';

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

export const makeUpdateResult = (init: Partial<UpdateResult> = {}): UpdateResult =>
  Object.assign({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedCount: 0,
    upsertedId: undefined,
  }, init);

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

export class MemoryCollection<T extends Document = any> extends AbstractCollection<T> {
  public static fromConfig<T = any>(name: string, database: Database, config: MemoryCollectionConfig) {
    const instance = new MemoryCollection<T>(name, database, config.documents || []);

    return config.disableEvents
      ? instance
      : withAutoEvent<T>(instance)
  }

  public constructor(
    public readonly name: string,
    protected database: Database,
    protected documents: T[] = [],
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

  public async insertOne(doc: any): Promise<InsertOneResult> {
    if (!doc.hasOwnProperty('_id')) {
      doc._id = new ObjectID().toHexString();
    } else if (this.indexOf(doc) >= 0) {
      throw new Error(
        `Insertion failed: A document with ID '${doc._id}' already exists in '${this.name}'`
      );
    }
    this.documents.push(doc);
    return {acknowledged: true, insertedId: doc._id};
  }

  public async replaceOne(
    filter: Filter<T>, replacement: T, options: ReplaceOneOptions = {}
  ): Promise<UpdateResult> {
    const query = new MingoQuery(filter as any);
    let result = makeUpdateResult({
      matchedCount: query.find(this.documents).count()
    });

    if (result.matchedCount > 0) {
      const old = query.find(this.documents).next() as T;
      this.documents[this.indexOf(old)] = Object.assign({}, {_id: old._id}, replacement);
      return {...result, modifiedCount: 1};
    } else if (options.upsert) {
      return Object.assign({...result, ...await this.upsertOne(replacement)});
    }
    return result;
  }

  public async deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    const affected = await this.findOne(filter) as any;
    if (affected) {
      this.documents = this.documents.filter(doc => doc._id !== affected._id);
    }
    return {acknowledged: true, deletedCount: affected ? 1 : 0};
  }

  public async deleteMany(filter: Filter<T>): Promise<DeleteResult> {
    const affected = new MingoQuery(filter).find(this.documents).all() as any[];
    const ids = idSet(affected);
    this.documents = this.documents.filter(doc => !ids.has(doc._id));
    return {acknowledged: true, deletedCount: affected.length};
  }

  private indexOf(doc: T): number {
    return this.documents.findIndex(o => o._id === doc._id);
  }
}


export function memory<T = any>(config: MemoryCollectionConfig<T> = {}): CollectionFactory<T> {
  return Factory.of(({name, database}) =>
    MemoryCollection.fromConfig<T>(name, database, config)
  );
}
