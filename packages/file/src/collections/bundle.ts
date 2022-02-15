import {Factory} from '@tashmit/core';
import {CollectionFactory, ChangeSet, CollectionDriver, Collection, withMiddleware, locked} from '@tashmit/database';
import {BufferDriver} from './buffer';
import {Pipeline} from '../pipeline';
import {MemoryDriver} from '@tashmit/database/dist/collections/memory';

export type BundleOutput<T> = (source: Pipeline<T>) => Promise<void>;

export interface BundleStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  output: BundleOutput<T>;
}

export type BundleStreamFactory<T> = Factory<BundleStreamConfig<T>>;

export interface BundleConfig<T> {
  stream: BundleStreamFactory<T>;
}

export class BundleDriver<TSchema> extends BufferDriver<TSchema> {
  public constructor(
    readonly ns: { db: string; coll: string },
    buffer: CollectionDriver<TSchema>,
    public output: BundleOutput<TSchema>,
  ) {
    super(ns, buffer);
  }

  public async persist() {
    return this.output(Pipeline.fromCursor(this.buffer.find()));
  }
}

/**
 * A buffered collection stored in a single location
 */
export function bundle<T>(config: BundleConfig<T>): CollectionFactory {
  return Factory.of(({name, database, container}) => {
    const {seed, input, output} = config.stream.resolve(container)();
    const buffer = new MemoryDriver<T>({db: 'tashmit', coll: name}, database, []);
    const driver = new BundleDriver({db: 'tashmit', coll: name}, buffer, output);
    const collection = new Collection<T>(driver);

    const listen = async (input: Pipeline<T>) => {
      return driver.load(ChangeSet.fromDiff(await buffer.find().toArray(), await input.toArray()));
    }

    if (input) {
      listen(input);
    }
    return withMiddleware<T>(collection, [locked([driver.populate(seed)])])
  });
}
