import {AsyncFactory} from '@ziqquratu/core';
import {Collection, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/database';
import {difference, intersection, isEqual} from 'lodash';
import {BufferCollection} from './buffer';
import {Generator} from '../generator';

export interface BundleStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: AsyncGenerator<T>;
  
  input?: AsyncGenerator<T>;

  output: (source: AsyncGenerator<T>) => Promise<void>;
}

export abstract class BundleStreamFactory<T> extends AsyncFactory<BundleStreamConfig<T>> {
  public abstract create(): Promise<BundleStreamConfig<T>>;
}

export interface BundleConfig {
  stream: BundleStreamFactory<any[]>;
}

export class BundleBuffer extends BufferCollection {
  public constructor(
    protected output: (source: AsyncGenerator) => Promise<void>,
    cache: Collection,
  ) {
    super(cache);
  }

  public async populate(seed: AsyncGenerator<any[]>) {
    for await (const data of seed) {
      await this.cache.insertMany(data as any[]);
    }
  }

  public async listen(input: AsyncGenerator<any[]>) {
    for await (const data of input) {
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
    return this.output(Generator.fromOne(await this.cache.find().toArray()));
  }
}

export class BundleBufferFactory extends CollectionFactory {
  public constructor(private config: BundleConfig) {super()}

  public async create(name: string, database: Database) {
    const {stream} = this.config;

    const {seed, input, output} = await stream.create();
    const cache = new MemoryCollection(name, database, {disableEvents: true});
    const buffer = new BundleBuffer(output, cache);

    if (seed) {
      await buffer.populate(seed);
    }
    if (input) {
      buffer.listen(input);
    }
    return buffer;
  }
}

/**
 * A buffered collection stored in a single location
 */
export const bundle = (config: BundleConfig) => new BundleBufferFactory(config);
