import {
  Collection,
  AutoEventCollection,
  Cursor,
  Filter,
  ReplaceOneOptions,
  QueryOptions,
  AggregationPipeline
} from '@ziqquratu/database';

export abstract class BufferCollection<T = any> extends AutoEventCollection<T> {
  public constructor(
    protected cache: Collection,
  ) {
    super();
  }

  public toString(): string {
    return `buffer collection '${this.name}'`;
  }

  public aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    return this.cache.aggregate(pipeline);
  }

  public async insertOne(doc: any, writeThrough = true): Promise<any> {
    const res = await this.cache.insertOne(doc);
    try {
      if (writeThrough) {
        await this.write([res]);
      }
    } catch (err) {
      await this.cache.deleteOne({_id: doc._id});
      throw err;
    }
    return res;
  }

  public async insertMany(docs: any[], writeThrough = true): Promise<any[]> {
    const res = await this.cache.insertMany(docs);
    try {
      if (writeThrough) {
        await this.write(docs);
      }
    } catch (err) {
      await this.cache.deleteMany({_id: {$in: docs.map(d => d._id)}});
      throw err;
    }
    return res;
  }

  public async replaceOne(filter: Filter<T>, doc: any, options: ReplaceOneOptions = {}, writeThrough = true): Promise<any> {
    const result = await this.cache.replaceOne(filter, doc, options);
    if (result) {
      if (writeThrough) {
        await this.write([result]);
      }
    }
    return result;
  }

  public find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T> {
    return this.cache.find(filter, options);
  }

  public async findOne(filter: Filter<T>): Promise<any> {
    return this.cache.findOne(filter);
  }

  public async deleteOne(filter: Filter<T>, writeThrough = true): Promise<any> {
    const affected = await this.cache.deleteOne(filter);
    if (affected) {
      if (writeThrough) {
        await this.write([affected], true);
      }
    }
    return affected;
  }

  public async deleteMany(filter: Filter<T>): Promise<any[]> {
    const affected = await this.cache.deleteMany(filter);
    await this.write(affected, true);
    return affected;
  }

  public get name(): string {
    return this.cache.name;
  }

  protected abstract write(affectedDocs: any[], deletion?: boolean): Promise<void>;
}
