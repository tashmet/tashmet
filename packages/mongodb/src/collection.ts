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
import mongo from 'mongodb';

export class MongoDBCursor<T = any> implements Cursor<T> {
  public constructor(
    private cursor: mongo.FindCursor,
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

export class MongoDBCollection extends AutoEventCollection {
  public constructor(
    private collection: mongo.Collection,
    public readonly name: string
  ) {
    super();
  }

  public aggregate<U>(pipeline: AggregationPipeline) {
    return this.collection.aggregate<U>(pipeline).toArray();
  }

  public find(selector: object = {}, options?: QueryOptions): Cursor<any> {
    return new MongoDBCursor(this.collection.find(selector), options);
  }

  public async findOne(selector: object): Promise<any> {
    return this.collection.findOne(selector);
  }

  public async insertOne(doc: any): Promise<any> {
    let res = await this.collection.insertOne(doc);
    if (!res.acknowledged) {
      throw Error('Failed to insert document');
    }
    return Object.assign({_id: res.insertedId}, doc);
  }

  public async insertMany(docs: any[]): Promise<any[]> {
    let res = await this.collection.insertMany(docs);
    if (!res.acknowledged) {
      throw Error('Failed to insert documents');
    }
    return Object.keys(res.insertedIds).map(key => {
      const i = parseInt(key);
      return Object.assign({_id: res.insertedIds[i]}, docs[i]);
    })
  }

  public async replaceOne(selector: object, doc: any, options?: ReplaceOneOptions): Promise<any> {
    return this.collection.replaceOne(selector, doc, options || {});
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
