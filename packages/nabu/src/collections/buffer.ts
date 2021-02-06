import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline, AggregationOptions, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {EventEmitter} from 'eventemitter3';
import {StreamFactory} from '../interfaces';
import * as stream from 'stream';

export enum BufferStreamMode {
  Update,
  Delete,
  Seed,
}

export interface BufferStreamFactory extends StreamFactory {
  createReadable(mode: BufferStreamMode): stream.Readable;
  createWritable(mode: BufferStreamMode): stream.Writable;
}

export class Buffer extends EventEmitter implements Collection {
  public constructor(
    protected cache: Collection,
    protected io: BufferStreamFactory,
    private bundle: boolean,
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
 
  public async insertMany(docs: any[]): Promise<any[]> {
    const res = await this.cache.insertMany(docs);
    try {
      await this.write(docs);
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

  public async populate(): Promise<Collection> {
    const readable = this.createReader(BufferStreamMode.Seed, data => {
      if (this.bundle) {
        return this.cache.insertMany(data);
      } else {
        return this.cache.insertOne(data);
      }
    });

    await new Promise<void>((resolve, reject) => {
      if (readable === undefined) {
        return resolve();
      }

      readable.on('end', resolve)
      readable.on('error', err => reject(err));
    });

    this.createReader(BufferStreamMode.Update, async data => {
      if (this.bundle) {
        for (const doc of data) {
          await this.replaceOne({_id: doc._id}, doc, {upsert: true}, false);
        }
      } else {
        return this.replaceOne({_id: data._id}, data, {upsert: true}, false);
      }
    });

    if (!this.bundle) {
      this.createReader(BufferStreamMode.Delete, doc =>
        this.deleteOne({_id: doc._id}, false)
      );
    }
    return this;
  }

  private async write(affectedDocs: any[], deletion?: boolean): Promise<void> {
    if (this.bundle) {
      return this.writeAsync(await this.cache.find().toArray(), BufferStreamMode.Update);
    } else {
      for (const doc of affectedDocs) {
        await this.writeAsync(doc, deletion ? BufferStreamMode.Delete : BufferStreamMode.Update);
      }
    }
  }

  private createReader(mode: BufferStreamMode, handler: (doc: any) => Promise<any>) {
    const readable = this.io.createReadable(mode);

    if (readable) {
      readable.on('readable', async () => { 
        let doc; 
        while (null !== (doc = readable.read())) { 
          await handler(doc);
        } 
      }); 
    }
    return readable;
  }

  private writeAsync(data: any, mode: BufferStreamMode): Promise<void> {
    const writable = this.io.createWritable(mode);

    return new Promise((resolve, reject) => {
      writable.on('finish', () => resolve());

      writable.write(data, err => {
        if (err) {
          reject(err);
        } else {
          writable.end();
        }
      });
    });
  }
}


export interface BufferConfig {
  /**
   * Input/Output stream
   */
  io: BufferStreamFactory;

  bundle: boolean;
}


export class BufferCollectionFactory extends CollectionFactory {
  constructor(private config: BufferConfig) {
    super();
  }

  public async create(name: string, database: Database): Promise<Collection> {
    const { io, bundle } = this.config;

   return new Buffer(
     new MemoryCollection(name, database, {disableEvents: true}), io, bundle
   ).populate();
  }
}

export const buffer = (config: BufferConfig) => new BufferCollectionFactory(config);
