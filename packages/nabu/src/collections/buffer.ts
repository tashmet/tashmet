import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline, AggregationOptions, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {EventEmitter} from 'eventemitter3';
import {difference, intersection, isEqual} from 'lodash';
import {generateMany, generateOne} from '../pipes';

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

export class BundledBuffer extends Buffer {
  public constructor(
    protected seed: AsyncGenerator<any>,
    protected input: AsyncGenerator<any[]> | undefined,
    protected output: (source: AsyncGenerator) => Promise<void>,
    cache: Collection,
  ) {
    super(cache);
  }

  public async populate() {
    for await (const data of this.seed) {
      await this.cache.insertMany(data as any[]);
    }
  }

  public async listen() {
    if (!this.input) {
      return;
    }

    for await (const data of this.input) {
      const bufferDocs = await this.cache.find().toArray();
      const getIds = (docs: any[]) => docs.map(doc => doc._id);

      const diff = (a: any[], b: any[]) => {
        const ids = difference(getIds(a), getIds(b));
        return a.filter(doc => ids.includes(doc._id));
      }

      const changed = intersection(getIds(data), getIds(bufferDocs)).reduce((acc, id) => {
        const doc = data.find((d: any) => d._id === id);

        if (!isEqual(doc, bufferDocs.find(d => d._id === id))) {
          acc.push(doc);
        }
        return acc;
      }, []);

      for (const doc of diff(bufferDocs, data)) {
        await this.deleteOne(doc, false);
      }
      for (const doc of changed) {
        await this.replaceOne({_id: doc._id}, doc, {}, false);
      }
      for (const doc of diff(data, bufferDocs)) {
        await this.insertOne(doc, false);
      }
    }
  }

  protected async write(): Promise<void> {
    return this.output(generateOne(await this.cache.find().toArray()));
  }
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


export interface BundledBufferConfig {
  /**
   * Input/Output stream
   */
  seed: AsyncGenerator<any>;
  
  input?: AsyncGenerator<any>;

  output: (source: AsyncGenerator<any>) => Promise<void>;
}


export class BundledBufferCollectionFactory extends CollectionFactory {
  constructor(private config: BundledBufferConfig) {
    super();
  }

  public async create(name: string, database: Database): Promise<Collection> {
    const { seed, input, output } = this.config;

   const buffer = new BundledBuffer(
     seed,
     input,
     output,
     new MemoryCollection(name, database, {disableEvents: true}),
   );
   await buffer.populate();
   buffer.listen();
   return buffer;
  }
}

export const bundledBuffer = (config: BundledBufferConfig) => new BundledBufferCollectionFactory(config);

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
