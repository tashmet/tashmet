import {bundledBuffer, BundledBufferConfig} from './buffer';
import {transformOutput, dict, transformInput, Transform} from '../pipes';
import {AsyncFactory, CollectionFactory, Database} from '@ziqquratu/ziqquratu';
import {IOGate, Pipe} from '@ziqquratu/pipe';

export abstract class BundleStreamFactory extends AsyncFactory<BundledBufferConfig> {
  public abstract create(tIn: Transform, tOut: Transform): Promise<BundledBufferConfig>;
}

export interface BundleConfig {
  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: IOGate<Pipe>;

  /**
   * Store the collection as a dictionary instead of a list
   * 
   * If set the collection will be stored as a dictionary on disk with keys
   * being the IDs of each document.
   */
  dictionary: boolean;

  stream: BundleStreamFactory;
}

export class BundleFactory extends CollectionFactory {
  public constructor(private config: BundleConfig) {super()}

  public async create(name: string, database: Database) {
    const {serializer, dictionary, stream} = this.config;
    const transforms: IOGate<Pipe>[] = [serializer];

    if (dictionary) {
      transforms.push(dict());
    }

    return bundledBuffer(await stream.create(transformInput(transforms), transformOutput(transforms)))
      .create(name, database);
  }
}

/**
 * A collection based on a single stream
 */
export const bundle = (config: BundleConfig) => new BundleFactory(config);
