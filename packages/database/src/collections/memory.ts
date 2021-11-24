import {Factory} from '@tashmit/core';
import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  Collection,
  CollectionFactory,
  Cursor,
  Document,
  Filter,
  OptionalId,
  QueryOptions,
  SortingKey,
  SortingDirection,
} from '../interfaces';
import {applyQueryOptions, sortingMap} from '../cursor';
import {idSet} from '../util';
import {aggregate} from '../aggregation';
import {BulkWriteOperationFactory, CollectionDriver} from './common';

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


export class MemoryDriver<TSchema extends Document> implements CollectionDriver<TSchema> {
  public constructor(
    public documents: TSchema[]
  ) {}

  public indexOf(document: OptionalId<TSchema>) {
    return this.documents.findIndex(o => o._id === document._id);
  }

  public async insert(document: OptionalId<TSchema>) {
    if (!document.hasOwnProperty('_id')) {
      document._id = new ObjectID().toHexString() as any;
    } else if (this.indexOf(document) >= 0) {
      throw new Error('Duplicate IDs');
    }
    this.documents.push(document as TSchema);
  }

  public async delete(matched: TSchema[]) {
    const ids = idSet(matched);
    this.documents = this.documents.filter(doc => !ids.has(doc._id));
  }

  public async replace(old: TSchema, replacement: TSchema) {
    this.documents[this.indexOf(old as any)] = {_id: old._id, ...replacement};
  }

  public async findOne(filter: Filter<TSchema>): Promise<TSchema | null> {
    return new MingoQuery(filter).find(this.documents).next() as any || null;
  }

  public find(filter: Filter<TSchema>, options: QueryOptions<TSchema> = {}): Cursor<TSchema> {
    return new MemoryCollectionCursor<TSchema>(this.documents, filter, options);
  }
}


export function memory<T extends Document = Document>(config: MemoryCollectionConfig<T> = {}): CollectionFactory<T> {
  return Factory.of(({name, database}) => {
    const driver = new MemoryDriver<T>(config.documents || []);
    return new Collection(
      name,
      BulkWriteOperationFactory.fromDriver(driver),
      driver,
      pipeline => aggregate(pipeline, driver.documents, database)
    );
  });
}
