import {Factory} from '@tashmit/core';
import {Query as MingoQuery} from 'mingo/query';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  CollectionDriver,
  CollectionFactory,
  Cursor,
  Document,
  Filter,
  OptionalId,
  QueryOptions,
  SortingKey,
  SortingDirection,
} from '../interfaces';
import {Collection} from '../collection';
import {applyQueryOptions, sortingMap} from '../cursor';
import {idSet} from '../util';
import {aggregate} from '../aggregation';
import {Database, withMiddleware} from '..';
import {locked} from '../middleware/locking';

export interface MemoryCollectionConfig<T = any> {
  /**
   * A list of documents this collection should operate on.
   *
   * If not provided an empty list will be created.
   */
  documents?: OptionalId<T>[] | Promise<OptionalId<T>[]>;
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
    public readonly ns: { db: string; coll: string },
    public readonly database: Database,
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

  public aggregate<T>(pipeline: Document[]): Promise<T[]> {
    return aggregate(pipeline, this.documents, this.database);
  }
}


export function memory<T extends Document = Document>(config: MemoryCollectionConfig<T> = {}): CollectionFactory<T> {
  const documents = config.documents || [];
  const isLocked = documents instanceof Promise;

  return Factory.of(({name, database}) => {
    const driver = new MemoryDriver<T>({db: 'tashmit', coll: name}, database, isLocked || !documents ? [] : documents as T[]);

    const collection = new Collection<T>(name, driver);

    if (isLocked) {
      const populate = async () => collection.insertMany(await documents);
      return withMiddleware<T>(collection, [locked([populate()])]);
    }
    return collection;
  });
}
