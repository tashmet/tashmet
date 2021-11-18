import {
  AbstractCollection,
  aggregate,
  Cursor,
  Filter,
  QueryOptions,
  ReplaceOneOptions,
  AggregationPipeline,
  Database,
  QueryAggregator,
  InsertOneResult,
  DeleteResult,
  UpdateResult,
  Document,
  makeUpdateResult,
} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpCollectionCursor} from './cursor';
import {HttpRestLayer} from './common';

export class HttpCollection<T extends Document> extends AbstractCollection<T> {
  public constructor(
    public readonly name: string,
    private database: Database,
    private restLayer: HttpRestLayer,
    private querySerializer: QuerySerializer,
  ) {
    super();
  }

  public toString(): string {
    return `http collection '${this.name}' at '${this.restLayer.path}'`;
  }

  public async aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    try {
      return QueryAggregator.fromPipeline<T>(pipeline, true).execute(this) as any;
    } catch (error) {
      const input = await QueryAggregator.fromPipeline<T>(pipeline).execute(this);
      return aggregate<U>(pipeline, input, this.database);
    }
  }

  public find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T> {
    return new HttpCollectionCursor<T>(
      this.restLayer, this.querySerializer, filter, options
    );
  }

  public async findOne(filter: Filter<T>): Promise<T | null> {
    return this.find(filter).limit(1).next();
  }

  public async insertOne(doc: T): Promise<InsertOneResult> {
    const result = await this.restLayer.post(doc);
    Object.assign(doc, {_id: result.insertedId});
    return result;
  }

  public async replaceOne(
    filter: Filter<T>, replacement: T, options: ReplaceOneOptions = {}): Promise<UpdateResult>
  {
    let result = makeUpdateResult({
      matchedCount: await this.find(filter).count(),
    });
    if (result.matchedCount > 0) {
      const old = await this.findOne(filter) as any;
      await this.restLayer.put(Object.assign({_id: old._id}, replacement), old._id);
      return {...result, modifiedCount: 1};
    } else if (options.upsert) {
      return Object.assign({...result, ...await this.upsertOne(replacement)});
    }
    return result;
  }

  public async deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    const doc = await this.findOne(filter);
    if (doc) {
      await this.restLayer.delete(doc._id);
    }
    return {acknowledged: true, deletedCount: doc ? 1 : 0};
  }

  public async deleteMany(filter: Filter<T>): Promise<DeleteResult> {
    const docs = await this.find(filter, {projection: {_id: 1}}).toArray();
    for (const doc of docs) {
      await this.restLayer.delete((doc as any)._id);
    }
    return {acknowledged: true, deletedCount: docs.length};
  }
}
