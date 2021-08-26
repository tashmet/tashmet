import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline} from '@ziqquratu/database';
import {EventEmitter} from 'eventemitter3';

export abstract class BufferCollection<T = any> extends EventEmitter implements Collection<T> {
  public constructor(
    protected cache: Collection,
  ) {
    super();
  }

  public toString(): string {
    return `buffer collection '${this.name}'`;
  }

  public aggregate<U>(pipeline: AggregationPipeline): Cursor<U> {
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
    this.emit('document-upserted', doc);
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
    for (const doc of docs) {
      this.emit('document-upserted', doc);
    }
    return res;
  }

  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}, writeThrough = true): Promise<any> {
    const result = await this.cache.replaceOne(selector, doc, options);
    if (result) {
      if (writeThrough) {
        await this.write([result]);
      }
      this.emit('document-upserted', result);
    }
    return result;
  }

  public find(selector?: object, options?: QueryOptions): Cursor<any> {
    return this.cache.find(selector, options);
  }

  public async findOne(selector: any): Promise<any> {
    return this.cache.findOne(selector);
  }

  public async deleteOne(selector: any, writeThrough = true): Promise<any> {
    const affected = await this.cache.deleteOne(selector);
    if (affected) {
      if (writeThrough) {
        await this.write([affected], true);
      }
      this.emit('document-removed', affected);
    }
    return affected;
  }

  public async deleteMany(selector: any): Promise<any[]> {
    const affected = await this.cache.deleteMany(selector);
    await this.write(affected, true);
    for (const doc of affected) {
      this.emit('document-removed', doc);
    }
    return affected;
  }

  public get name(): string {
    return this.cache.name;
  }

  protected abstract write(affectedDocs: any[], deletion?: boolean): Promise<void>;
}
