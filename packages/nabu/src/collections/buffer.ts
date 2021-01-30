import {Collection, Cursor, ReplaceOneOptions, QueryOptions, AggregationPipeline, AggregationOptions, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {EventEmitter} from 'eventemitter3';
import {StreamFactory} from '../pipes';

export class BufferCollection extends EventEmitter implements Collection {
  public constructor(
    protected stream: StreamFactory,
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

  public async insertOne(doc: any): Promise<any> {
    const res = await this.cache.insertOne(doc);
    try {
      await this.write([res]);
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
    return this.write([result]);
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
      await this.write([affected], true);
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

  public populate(): Promise<Collection> {
    const readable = this.stream.createReadable();

    return new Promise((resolve, reject) => {
      readable.on('readable', async () => { 
        let chunk; 
        while (null !== (chunk = readable.read())) { 
          await this.read(chunk);
        } 
      }); 
      readable.on('end', () => resolve(this));
      readable.on('error', err => reject(err));
    });
  }

  protected async read(doc: any) {
    if (doc._delete) {
      const res = await this.cache.deleteOne({_id: doc._id});
      if (res) {
        this.emit('document-removed', res);
      }
    } else {
      const res = await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      if (res) {
        this.emit('document-upserted', res);
      }
    }
  }

  protected async write(docs: any[], del = false): Promise<void> {
    for (const doc of docs) {
      const output = del ? Object.assign({}, doc, {_delete: true}) : doc;
      await this.writeAsync(output);
    }
  }

  protected writeAsync(data: any): Promise<void> {
    const writable = this.stream.createWritable();

    return new Promise((resolve, reject) => {
      writable.write(data, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
          writable.end();
        }
      });
    });
  }
}

export class BundleBufferCollection extends BufferCollection {
  protected async write(): Promise<void> {
    return this.writeAsync(await this.cache.find().toArray());
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
}

export interface BufferConfig {
  /**
   * Input/Output stream
   */
  stream: StreamFactory;

  bundle: boolean;
}

export class BufferCollectionFactory extends CollectionFactory {
  constructor(private config: BufferConfig) {
    super();
  }

  public async create(name: string, database: Database): Promise<Collection> {
    const Ctr = this.config.bundle ? BundleBufferCollection : BufferCollection;

    return new Ctr(this.config.stream, 
      new MemoryCollection(name, database, {disableEvents: true}),
    ).populate();
  }
}

export const buffer = (config: BufferConfig) => new BufferCollectionFactory(config);
