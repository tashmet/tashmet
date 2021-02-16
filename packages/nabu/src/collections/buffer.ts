import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline, AggregationOptions, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {EventEmitter} from 'eventemitter3';
import {generateMany} from '../pipes';

export abstract class Buffer extends EventEmitter implements Collection {
  public constructor(
    protected cache: Collection,
  ) {
    super();
  }

  public toString(): string {
    return `buffer collection '${this.name}'`;
  }

  public async aggregate(pipeline: AggregationPipeline, options?: AggregationOptions): Promise<any> {
    return this.cache.aggregate(pipeline, options);
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

  public abstract listen(): Promise<void>;

  public abstract populate(): Promise<void>;

  protected abstract write(affectedDocs: any[], deletion?: boolean): Promise<void>;
}


class ShardedBuffer extends Buffer {
  public constructor(
    private seed: AsyncGenerator<any>,
    private input: AsyncGenerator<any> | undefined,
    private inputDelete: AsyncGenerator<any> | undefined,
    private output: (source: AsyncGenerator<any>, deletion: boolean) => Promise<void>,
    cache: Collection,
  ) {
    super(cache);
  }

  public async populate() {
    for await (const doc of this.seed) {
      await this.cache.insertOne(doc);
    }
  }

  public async listen() {
    if (!this.input) {
      return;
    }

    for await (const doc of this.input) {
      await this.replaceOne({_id: doc._id}, doc, {upsert: true}, false);
    }
  }

  public async listenDelete() {
    if (!this.inputDelete) {
      return;
    }

    for await (const doc of this.inputDelete) {
      await this.deleteOne({_id: doc._id}, false);
    }
  }

  protected write(affectedDocs: any[], deletion: boolean): Promise<void> {
    return this.output(generateMany(affectedDocs), deletion);
  }
}

export interface ShardedBufferConfig {
  /**
   * Input/Output stream
   */
  seed: AsyncGenerator<any>;
  
  input?: AsyncGenerator<any>;

  inputDelete?: AsyncGenerator<any>;

  output: (source: AsyncGenerator<any>, deletion: boolean) => Promise<void>;
}


export class ShardedBufferCollectionFactory extends CollectionFactory {
  constructor(private config: ShardedBufferConfig) {
    super();
  }

  public async create(name: string, database: Database): Promise<Collection> {
    const { seed, input, inputDelete, output } = this.config;

   const buffer = new ShardedBuffer(
     seed,
     input,
     inputDelete,
     output,
     new MemoryCollection(name, database, {disableEvents: true}),
   );
   await buffer.populate();
   buffer.listen();
   buffer.listenDelete();
   return buffer;
  }
}

export const shardedBuffer = (config: ShardedBufferConfig) => new ShardedBufferCollectionFactory(config);
