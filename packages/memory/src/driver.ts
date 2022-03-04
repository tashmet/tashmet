import {Query as MingoQuery} from 'mingo/query';
import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import * as mingoCursor from 'mingo/cursor';
import ObjectID from 'bson-objectid';
import {
  ChangeSet,
  idSet,
  CollationOptions,
  CollectionDriver,
  Cursor,
  Document,
  Filter,
  OptionalId,
  FindOptions,
  SortingKey,
  SortingDirection,
  applyFindOptions,
  sortingMap,
} from '@tashmit/database';

export interface MemoryCreateCollectionOptions<T = any> {
  /**
   * A list of documents this collection should operate on.
   *
   * If not provided an empty list will be created.
   */
  documents?: OptionalId<T>[] | Promise<OptionalId<T>[]>;
}

export type CollectionResolver = (name: string) => any[];

export class MemoryCursor<T> implements Cursor<T> {
  private cursor: mingoCursor.Cursor;

  public constructor(
    private collection: any[],
    private filter: Filter<T> = {},
    options: FindOptions = {},
  ) {
    this.cursor = new MingoQuery(filter, {collation: options.collation}).find(collection, options.projection);
    applyFindOptions(this, options);
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

export interface MemoryDriverConfig<TSchema extends Document = any> {
  ns: {db: string, coll: string};
  collectionResolver?: CollectionResolver;
  documents?: TSchema[];
  collation?: CollationOptions;
}

export class MemoryDriver<TSchema extends Document> extends CollectionDriver<TSchema> {
  public constructor(
    ns: { db: string; coll: string },
    private collectionResolver: CollectionResolver | undefined  = undefined,
    public documents: TSchema[] = [],
    private collation: CollationOptions | undefined = undefined,
  ) { super(ns); }

  public static fromConfig<TSchema>({ns, collectionResolver, documents, collation}: MemoryDriverConfig<TSchema>) {
    return new MemoryDriver(ns, collectionResolver, documents, collation);
  }

  public indexOf(document: TSchema) {
    return this.documents.findIndex(o => o._id === document._id);
  }

  public async write(cs: ChangeSet<TSchema>) {
    for (const document of cs.insertions) {
      if (!document.hasOwnProperty('_id')) {
        (document as any)._id = new ObjectID().toHexString() as any;
      } else if (this.indexOf(document) >= 0) {
        throw new Error('Duplicate IDs');
      }
      this.documents.push(document);
    }

    for (const document of cs.replacements) {
      this.documents[this.indexOf(document as any)] = {_id: document._id, ...document};
    }

    const deletions = cs.deletions;
    if (deletions.length > 0) {
      const ids = idSet(deletions);
      this.documents = this.documents.filter(doc => !ids.has(doc._id));
    }
  }

  public async findOne(filter: Filter<TSchema>): Promise<TSchema | null> {
    return new MingoQuery(filter).find(this.documents).next() as any || null;
  }

  public find(filter: Filter<TSchema> = {}, options: FindOptions<TSchema> = {}): Cursor<TSchema> {
    return new MemoryCursor<TSchema>(this.documents, filter, {collation: this.collation, ...options});
  }

  public aggregate<T>(pipeline: Document[]): Cursor<T> {
    return new MemoryCursor<T>(
      new MingoAggregator(pipeline, {collectionResolver: this.collectionResolver}).run(this.documents) as T[]
    );
  }
}
