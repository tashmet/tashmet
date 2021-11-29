import {Factory} from '@tashmit/core';
import {CollectionFactory, ChangeSet} from '@tashmit/database';
import {buffer} from './buffer';
import {Pipeline} from '../pipeline';

export interface BundleStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  output: (source: Pipeline<T>) => Promise<void>;
}

export type BundleStreamFactory<T> = Factory<BundleStreamConfig<T>>;

export interface BundleConfig<T> {
  stream: BundleStreamFactory<T>;
}

/**
 * A buffered collection stored in a single location
 */
export function bundle<T>(config: BundleConfig<T>): CollectionFactory {
  return Factory.of(({name, database, container}) => {
    const {seed, input, output} = config.stream.resolve(container)();
    const cache = database.collection(name);

    const populate = async () => {
      if (seed) {
        await cache.insertMany(await seed.toArray());
      }
    }

    const collection = buffer(cache, populate(), () => output(Pipeline.fromCursor(cache.find())));

    const listen = async (input: Pipeline<T>) => {
      return ChangeSet.fromDiff(await cache.find().toArray(), await input.toArray())
        .applyTo(cache);
    }

    if (input) {
      listen(input);
    }
    return collection;
  });
}
