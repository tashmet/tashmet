import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline, AggregationOptions} from '@ziqquratu/ziqquratu';
import {PersistenceAdapter, ObjectMap} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {merge} from 'lodash';

export class PersistenceCollection extends EventEmitter implements Collection {
  public constructor(
    private adapter: PersistenceAdapter,
    private cache: Collection,
  ) {
    super();
    adapter.on('document-updated', (id: string, data: any) => {
      this.load(id, data);
    });
    adapter.on('document-removed', async (id: string) => {
      const doc = await cache.deleteOne({_id: id});
      if (doc) {
        this.emit('document-removed', doc);
      }
    });
  }

  public toString(): string {
    return `persistence collection '${this.name}' using ${this.adapter.toString()}`;
  }

  public async aggregate(pipeline: AggregationPipeline, options?: AggregationOptions): Promise<any> {
    return this.cache.aggregate(pipeline, options);
  }

  public async insertOne(doc: any): Promise<any> {
    const res = await this.cache.insertOne(doc);
    try {
      await this.adapter.write([res]);
    } catch (err) {
      await this.cache.deleteOne({_id: doc._id});
      throw err;
    }
    this.emit('document-upserted', doc);
    return res;
  }
  
  public async insertMany(docs: any[]): Promise<any[]> {
    const res = await this.cache.insertMany(docs);
    try {
      await this.adapter.write(docs);
    } catch (err) {
      await this.cache.deleteMany({_id: {$in: docs.map(d => d._id)}});
      throw err;
    }
    for (const doc of docs) {
      this.emit('document-upserted', doc);
    }
    return res;
  }
  
  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}): Promise<any> {
    const old = await this.cache.findOne(selector);
    if (old) {
      if (doc._id && doc._id !== old._id) {
        await this.adapter.remove([old._id]);
      }
      await this.adapter.write([Object.assign({}, {_id: old._id}, doc)]);
      const result = this.cache.replaceOne(selector, doc, options);
      if (result) {
        this.emit('document-upserted', result);
      }
      return result;
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public find(selector?: object, options?: QueryOptions): Cursor<any> {
    return this.cache.find(selector, options);
  }

  public async findOne(selector: any): Promise<any> {
    return this.cache.findOne(selector);
  }

  public async deleteOne(selector: any): Promise<any> {
    const affected = await this.cache.deleteOne(selector);
    if (affected) {
      await this.adapter.remove([affected._id]);
      this.emit('document-removed', affected);
    }
    return affected;
  }

  public async deleteMany(selector: any): Promise<any[]> {
    const affected = await this.cache.deleteMany(selector);
    await this.adapter.remove(affected.map(d => d._id));
    for (const doc of affected) {
      this.emit('document-removed', doc);
    }
    return affected;
  }

  public async populate(): Promise<Collection> {
    const data: ObjectMap = await this.adapter.read();
    for (const id of Object.keys(data)) {
      await this.load(id, data[id]);
    }
    return this;
  }

  public get name(): string {
    return this.cache.name;
  }

  private async load(id: string, doc: Record<string, any>): Promise<any> {
    const res = await this.cache.replaceOne({_id: id}, merge({}, doc, {_id: id}), {upsert: true});
    if (res) {
      this.emit('document-upserted', res);
    }
    return res;
  }
}
