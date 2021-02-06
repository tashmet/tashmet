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

export abstract class Buffer extends EventEmitter implements Collection {
  public constructor(
    protected cache: Collection,
    protected io: BufferStreamFactory,
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
 
  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}): Promise<any> {
    const result = await this.cache.replaceOne(selector, doc, options);
    if (result) {
      await this.write([result]);
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

  protected createReader(mode: BufferStreamMode, handler: (doc: any) => Promise<any>) {
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

  protected writeAsync(data: any, mode: BufferStreamMode): Promise<void> {
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


export class DocumentStreamBuffer extends Buffer {
  public populate(): Promise<Collection> {
    const readable = this.createReader(BufferStreamMode.Seed, doc => this.insertOne(doc, false));

    return new Promise((resolve, reject) => {
      if (readable === undefined) {
        this.onPopulated();
        return resolve(this);
      }

      readable.on('end', () => {
        this.onPopulated();
        return resolve(this);
      });
      readable.on('error', err => reject(err));
    });
  }

  protected async write(docs: any[], deletion = false): Promise<void> {
    for (const doc of docs) {
      await this.writeAsync(doc, deletion ? BufferStreamMode.Delete : BufferStreamMode.Update);
    }
  }

  private onPopulated() {
    this.createReader(BufferStreamMode.Update, async doc => {
      const res = await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      if (res) {
        this.emit('document-upserted', res);
      }
    });

    this.createReader(BufferStreamMode.Delete, doc =>
      this.deleteOne({_id: doc._id}, false)
    );
  }
}


export class CollectionStreamBuffer extends Buffer {
  protected async write(): Promise<void> {
    return this.writeAsync(await this.cache.find().toArray(), BufferStreamMode.Update);
  }

  // TODO: Only replace documents that have actually changed?
  protected async read(data: any[]) {
    for (const doc of data) {
      const res = await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      if (res) {
        this.emit('document-upserted', res);
      }
    }
  }

  public populate(): Promise<Collection> {
    const readable = this.createReader(BufferStreamMode.Seed, docs => this.cache.insertMany(docs));

    return new Promise((resolve, reject) => {
      if (readable === undefined) {
        return resolve(this);
      }

      readable.on('readable', async () => { 
        let docs; 
        while (null !== (docs = readable.read())) { 
          await this.cache.insertMany(docs);
        } 
      }); 
      readable.on('end', () => resolve(this));
      readable.on('error', err => reject(err));
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
    const cache = new MemoryCollection(name, database, {disableEvents: true});

    const buffer = bundle
      ? new CollectionStreamBuffer(cache, io)
      : new DocumentStreamBuffer(cache, io);

    return buffer.populate();
  }
}

export const buffer = (config: BufferConfig) => new BufferCollectionFactory(config);
