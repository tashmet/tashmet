import {AsyncFactory} from '@tashmit/core';
import {CollectionFactory, Database, MemoryCollection, withAutoEvent} from '@tashmit/database';
import {buffer} from './buffer';
import {Pipeline} from '../pipeline';

export interface ShardStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  inputDelete?: Pipeline<Partial<T>>;

  output: (source: Pipeline<T>, deletion: boolean) => Promise<void>;
}

export abstract class ShardStreamFactory<T> extends AsyncFactory<ShardStreamConfig<T>> {
  public abstract create(): Promise<ShardStreamConfig<T>>;
}

export interface ShardBufferConfig<T> {
  stream: ShardStreamFactory<T>;
}

export class ShardBufferFactory<T> extends CollectionFactory<T> {
  public constructor(private config: ShardBufferConfig<T>) {super()}

  public async create(name: string, database: Database) {
    const {stream} = this.config;

    const {seed, input, inputDelete, output} = await stream.create();
    const cache = MemoryCollection.fromConfig(name, database, {disableEvents: true});
    const instance = buffer(cache, async ({action, data}) => {
      switch (action) {
        case 'insert':
        case 'delete':
          return output(Pipeline.fromMany(data), action === 'delete');
        case 'replace':
          await output(Pipeline.fromOne(data[1]), false);
      }
    });

    const eachDocument = async (source: Pipeline, fn: (doc: any) => Promise<any>) => {
      for await (const doc of source) {
        await fn(doc);
      }
    }

    if (seed) {
      await eachDocument(seed, doc => cache.insertOne(doc));
    }
    if (input) {
      eachDocument(input, doc => cache.replaceOne({_id: doc._id}, doc, {upsert: true}));
    }
    if (inputDelete) {
      eachDocument(inputDelete, doc => cache.deleteOne({_id: doc._id}));
    }
    return withAutoEvent(instance);
  }
}

/**
 * A buffered collection based on documents in multiple locations
 */
export function shards<T = any>(config: ShardBufferConfig<T>) {
  return new ShardBufferFactory<T>(config);
}
