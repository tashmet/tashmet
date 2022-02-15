import {Factory} from '@tashmit/core';
import {
  Collection,
  CollectionFactory,
  CollectionDriver,
  Document,
  withMiddleware,
  locked,
  ChangeSet
} from '@tashmit/database';
import {Pipeline} from '../pipeline';
import {MemoryDriver} from '@tashmit/database/dist/collections/memory';
import {BufferDriver} from './buffer';

export type ShardOutput<T> = (source: Pipeline<T>, deletion: boolean) => Promise<void>;

export interface ShardStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  inputDelete?: Pipeline<Partial<T>>;

  output: ShardOutput<T>;
}

export type ShardStreamFactory<T> = Factory<ShardStreamConfig<T>>;

export interface ShardBufferConfig<T> {
  stream: ShardStreamFactory<T>;
}


export class ShardDriver<TSchema> extends BufferDriver<TSchema> {
  public constructor(
    readonly ns: { db: string; coll: string },
    buffer: CollectionDriver<TSchema>,
    public output: ShardOutput<TSchema>,
  ) {
    super(ns, buffer);
  }

  public async persist(cs: ChangeSet<TSchema>) {
    if (cs.deletions.length > 0) {
      await this.output(Pipeline.fromMany(cs.deletions), true);
    }
    if (cs.incoming.length > 0) {
      await this.output(Pipeline.fromMany(cs.incoming), false);
    }
  }
}


/**
 * A buffered collection based on documents in multiple locations
 */
export function shards<T extends Document = any>(config: ShardBufferConfig<T>): CollectionFactory<T> {
  const eachDocument = async (source: Pipeline, fn: (doc: any) => Promise<any>) => {
    for await (const doc of source) {
      await fn(doc);
    }
  }

  return Factory.of(({name, database, container}) => {
    const {seed, input, inputDelete, output} = config.stream.resolve(container)();
    const buffer = new MemoryDriver<T>({db: 'tashmit', coll: name}, database, []);
    const driver = new ShardDriver({db: 'tashmit', coll: name}, buffer, output);
    const collection = new Collection<T>(driver);
    const instance = withMiddleware<T>(collection, [locked([driver.populate(seed)])])

    if (input) {
      eachDocument(input, doc => driver.load(ChangeSet.fromInsert([doc])));
    }
    if (inputDelete) {
      eachDocument(inputDelete, doc => driver.load(ChangeSet.fromDelete([doc])));
    }
    return instance;
  });
}
