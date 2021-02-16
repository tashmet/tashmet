import {Buffer} from './buffer';
import {generateMany} from '../pipes';
import {AsyncFactory, Collection, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {IOGate, Pipe} from '@ziqquratu/pipe';

export interface ShardStreamConfig {
  /**
   * Input/Output stream
   */
  seed?: AsyncGenerator<any>;
  
  input?: AsyncGenerator<any>;

  inputDelete?: AsyncGenerator<any>;

  output: (source: AsyncGenerator<any>, deletion: boolean) => Promise<void>;
}

export abstract class ShardStreamFactory extends AsyncFactory<ShardStreamConfig> {
  public abstract create(transforms: IOGate<Pipe>[]): Promise<ShardStreamConfig>;
}

export interface ShardBufferConfig {
  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer?: IOGate<Pipe>;

  stream: ShardStreamFactory;
}

class ShardBuffer extends Buffer {
  public constructor(
    private output: (source: AsyncGenerator<any>, deletion: boolean) => Promise<void>,
    cache: Collection,
  ) {
    super(cache);
  }

  public async populate(seed: AsyncGenerator<any>) {
    for await (const doc of seed) {
      await this.cache.insertOne(doc);
    }
  }

  public async listen(input: AsyncGenerator<any>) {
    for await (const doc of input) {
      await this.replaceOne({_id: doc._id}, doc, {upsert: true}, false);
    }
  }

  public async listenDelete(input: AsyncGenerator<any>) {
    for await (const doc of input) {
      await this.deleteOne({_id: doc._id}, false);
    }
  }

  protected write(affectedDocs: any[], deletion: boolean): Promise<void> {
    return this.output(generateMany(affectedDocs), deletion);
  }
}

export class ShardBufferFactory extends CollectionFactory {
  public constructor(private config: ShardBufferConfig) {super()}

  public async create(name: string, database: Database) {
    const {serializer, stream} = this.config;
    const transforms: IOGate<Pipe>[] = [];

    if (serializer) {
      transforms.push(serializer);
    }

    const {seed, input, inputDelete, output} = await stream.create(
      transforms
    );
    const cache = new MemoryCollection(name, database, {disableEvents: true});
    const buffer = new ShardBuffer(output, cache);

    if (seed) {
      await buffer.populate(seed);
    }
    if (input) {
      buffer.listen(input);
    }
    if (inputDelete) {
      buffer.listenDelete(inputDelete);
    }
    return buffer;
  }
}

/**
 * A collection based on a multiple streams
 */
export const shards = (config: ShardBufferConfig) => new ShardBufferFactory(config);
