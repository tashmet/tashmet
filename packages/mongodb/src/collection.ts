import {
  AutoEventCollection,
  Cursor,
  ReplaceOneOptions,
  SortingDirection,
  SortingKey,
  sortingMap,
  applyQueryOptions,
  QueryOptions,
  AggregationPipeline
} from '@ziqquratu/database';
import * as mongo from 'mongodb';

export class MongoDBCursor<T = any> implements Cursor<T> {
  public constructor(
    private cursor: mongo.Cursor,
    options: QueryOptions = {},
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
    return this.cursor.next();
  }

  public async hasNext(): Promise<boolean> {
    return this.cursor.hasNext();
  }

  public async forEach(iterator: (doc: T) => void): Promise<void> {
    return this.cursor.forEach(iterator);
  }

  public async toArray(): Promise<T[]> {
    return this.cursor.toArray();
  }

  public async count(applySkipLimit = true): Promise<number> {
    return this.cursor.count(applySkipLimit);
  }
}

export class MongoDBCollection extends AutoEventCollection {
  public constructor(
    private collection: mongo.Collection,
    public readonly name: string
  ) {
    super();
  }

  public aggregate(pipeline: AggregationPipeline) {
    return this.collection.aggregate(pipeline).toArray();
  }

  public find(selector: object = {}, options?: QueryOptions): Cursor<any> {
    return new MongoDBCursor(this.collection.find(selector), options);
  }

  public async findOne(selector: object): Promise<any> {
    return this.collection.findOne(selector);
  }

  public async insertOne(doc: any): Promise<any> {
    let res = await this.collection.insertOne(doc);
    if (res.result.ok !== 1) {
      throw Error('Failed to insert document');
    }
    return res.ops ? res.ops[0] : doc;
  }

  public async insertMany(docs: any[]): Promise<any[]> {
    let res = await this.collection.insertMany(docs);
    if (res.result.ok !== 1) {
      throw Error('Failed to insert documents');
    }
    return res.ops ? res.ops : docs;
  }

  public async replaceOne(selector: object, doc: any, options?: ReplaceOneOptions): Promise<any> {
    return this.collection.replaceOne(selector, doc, options);
  }

  public async deleteOne(selector: object): Promise<any> {
    const doc = await this.findOne(selector);
    const res = await this.collection.deleteOne(selector);
    if (doc && res.deletedCount === 1) {
      return doc;
    }
    return null;
  }

  public async deleteMany(selector: object): Promise<any[]> {
    const docs = await this.find(selector).toArray();
    await this.collection.deleteMany(selector);
    return docs;
  }
}
