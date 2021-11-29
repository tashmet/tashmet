import {Factory} from '@tashmit/core';
import {CollectionFactory} from '@tashmit/database';
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

export type ShardStreamFactory<T> = Factory<ShardStreamConfig<T>>;

export interface ShardBufferConfig<T> {
  stream: ShardStreamFactory<T>;
}

/**
 * A buffered collection based on documents in multiple locations
 */
export function shards<T = any>(config: ShardBufferConfig<T>): CollectionFactory<T> {
  const eachDocument = async (source: Pipeline, fn: (doc: any) => Promise<any>) => {
    for await (const doc of source) {
      await fn(doc);
    }
  }

  return Factory.of(({name, database, container}) => {
    const {seed, input, inputDelete, output} = config.stream.resolve(container)();
    const cache = database.collection(name);

    const populate = async () => {
      if (seed) {
        await eachDocument(seed, doc => cache.insertOne(doc));
      }
    }

    const instance = buffer(cache, populate(), async ({action, data}) => {
      switch (action) {
        case 'insert':
        case 'delete':
          return output(Pipeline.fromMany(data), action === 'delete');
        case 'replace':
          await output(Pipeline.fromOne(data[1]), false);
      }
    });

    if (input) {
      eachDocument(input, doc => cache.replaceOne({_id: doc._id}, doc, {upsert: true}));
    }
    if (inputDelete) {
      eachDocument(inputDelete, doc => cache.deleteOne({_id: doc._id}));
    }
    return instance;
  });
}
