import {
  Cursor,
  Filter,
  ReplaceOneOptions,
  SortingDirection,
  SortingKey,
  sortingMap,
  applyQueryOptions,
  QueryOptions,
  AggregationPipeline,
  Collection,
  InsertOneResult,
  InsertManyResult,
  withAutoEvent
} from '@tashmit/database';
import mongo from 'mongodb';
import {MongoDBCollectionConfig} from './interfaces';

export class MongoDBCursor<T = any> implements Cursor<T> {
  public constructor(
    private cursor: mongo.FindCursor<T>,
    options: QueryOptions<T> = {},
  ) {
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
    return this.cursor.next() as any;
  }

  public async hasNext(): Promise<boolean> {
    return this.cursor.hasNext();
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return this.cursor.forEach(iterator);
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.toArray() as any;
  }

  public async count(applySkipLimit = true): Promise<number> {
    return this.cursor.count();
  }
}

export class MongoDBCollection<T> extends Collection<T> {
  public static fromConfig<T = any>(name: string, config: MongoDBCollectionConfig) {
    const instance = new MongoDBCollection<T>(config.collection, name);
    return config.disableEvents ? withAutoEvent(instance) : instance;
  }

  public constructor(
    private collection: mongo.Collection,
    public readonly name: string
  ) {
    super();
  }

  public aggregate<U>(pipeline: AggregationPipeline) {
    return this.collection.aggregate<U>(pipeline).toArray();
  }

  public find(filter: Filter<T> = {}, options?: QueryOptions): Cursor<T> {
    return new MongoDBCursor(this.collection.find(filter), options);
  }

  public async findOne(filter: Filter<T>): Promise<any> {
    return this.collection.findOne(filter);
  }

  public async insertOne(doc: any): Promise<InsertOneResult> {
    return this.collection.insertOne(doc) as any;
  }

  public async insertMany(docs: any[]): Promise<InsertManyResult> {
    return this.collection.insertMany(docs) as any;
  }

  public async replaceOne(filter: Filter<T>, doc: any, options?: ReplaceOneOptions): Promise<any> {
    return this.collection.replaceOne(filter, doc, options || {});
  }

  public async deleteOne(filter: Filter<T>): Promise<T | null> {
    const doc = await this.findOne(filter);
    const res = await this.collection.deleteOne(filter);
    if (doc && res.deletedCount === 1) {
      return doc;
    }
    return null;
  }

  public async deleteMany(filter: Filter<T>): Promise<T[]> {
    const docs = await this.find(filter).toArray();
    await this.collection.deleteMany(filter);
    return docs;
  }
}
