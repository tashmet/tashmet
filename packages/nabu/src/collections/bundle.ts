import {Buffer} from './buffer';
import {transformOutput, dict, transformInput, Transform} from '../pipes';
import {AsyncFactory, Collection, CollectionFactory, Database, MemoryCollection} from '@ziqquratu/ziqquratu';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import {difference, intersection, isEqual} from 'lodash';
import {generateOne} from '../pipes';

export interface BundleStreamConfig {
  /**
   * Input/Output stream
   */
  seed: AsyncGenerator<any>;
  
  input?: AsyncGenerator<any>;

  output: (source: AsyncGenerator<any>) => Promise<void>;
}

export abstract class BundleStreamFactory extends AsyncFactory<BundleStreamConfig> {
  public abstract create(tIn: Transform, tOut: Transform): Promise<BundleStreamConfig>;
}

export interface BundleConfig {
  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer?: IOGate<Pipe>;

  /**
   * Stream the collection as a dictionary instead of a list
   * 
   * If set the collection will be streamed as a dictionary with keys
   * being the IDs of each document.
   * 
   * @default false
   */
  dictionary?: boolean;

  stream: BundleStreamFactory;
}

export class BundleBuffer extends Buffer {
  public constructor(
    protected seed: AsyncGenerator<any>,
    protected input: AsyncGenerator<any[]> | undefined,
    protected output: (source: AsyncGenerator) => Promise<void>,
    cache: Collection,
  ) {
    super(cache);
  }

  public async populate() {
    for await (const data of this.seed) {
      await this.cache.insertMany(data as any[]);
    }
  }

  public async listen() {
    if (!this.input) {
      return;
    }

    for await (const data of this.input) {
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
    return this.output(generateOne(await this.cache.find().toArray()));
  }
}

export class BundleBufferFactory extends CollectionFactory {
  public constructor(private config: BundleConfig) {super()}

  public async create(name: string, database: Database) {
    const {serializer, dictionary, stream} = this.config;
    const transforms: IOGate<Pipe>[] = [];

    if (serializer) {
      transforms.push(serializer);
    }

    if (dictionary) {
      transforms.push(dict());
    }

    const {seed, input, output} = await stream.create(transformInput(transforms), transformOutput(transforms));

    const buffer = new BundleBuffer(
      seed,
      input,
      output,
      new MemoryCollection(name, database, {disableEvents: true}),
    );
    await buffer.populate();
    buffer.listen();
    return buffer;
  }
}

/**
 * A collection based on a single stream
 */
export const bundle = (config: BundleConfig) => new BundleBufferFactory(config);
