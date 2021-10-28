import {AsyncFactory, Factory} from '@tashmit/core';
import {CollectionFactory, MemoryCollection, withAutoEvent} from '@tashmit/database';
import {difference, intersection, isEqual} from 'lodash';
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

export type BundleStreamFactory<T> = AsyncFactory<BundleStreamConfig<T>>;

export interface BundleConfig<T> {
  stream: BundleStreamFactory<T>;
}

/**
 * A buffered collection stored in a single location
 */
export function bundle<T>(config: BundleConfig<T>): CollectionFactory {
  return Factory.of(async ({name, database, container}) => {
    const {seed, input, output} = await config.stream.resolve(container)();
    const cache = MemoryCollection.fromConfig(name, database, {disableEvents: true});

    const collection = buffer(cache, () => output(Pipeline.fromCursor(cache.find())));

    const listen = async (input: Pipeline<T>) => {
      const data = await input.toArray();
      const bufferDocs = await cache.find().toArray();
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
        await cache.deleteOne(doc);
      }
      for (const doc of changed) {
        await cache.replaceOne({_id: doc._id}, doc, {});
      }
      for (const doc of diff(data, bufferDocs)) {
        await cache.insertOne(doc);
      }
    }

    if (seed) {
      await cache.insertMany(await seed.toArray());
    }
    if (input) {
      listen(input);
    }
    return withAutoEvent(collection);
  });
}
