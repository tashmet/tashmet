import {FileSystemConfig} from '../interfaces';
import Vinyl from 'vinyl';
import {bundledBuffer, BundledBufferConfig} from './buffer';
import {transformOutput, dict, generateOne, pump, vinylContents, transformInput, writeToStream, Transform} from '../pipes';
import * as fs from 'fs';
import { AsyncFactory, CollectionFactory, Database } from '@ziqquratu/ziqquratu';
import { IOGate, Pipe } from '@ziqquratu/pipe';
import { VinylFS } from '../vinyl/fs';

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

  stream: AsyncFactory<BundledBufferConfig>;
}

export interface FileStreamConfig {
  /**
   * Path to file.
   */
  path: string;
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

export class LocalFileConfigFactory extends AsyncFactory<BundledBufferConfig> {
  public constructor(private config: FileStreamConfig) {
    super('nabu.FileSystemConfig', VinylFS)
  }

  public async create(tIn: Transform, tOut: Transform) {
    const {path} = this.config;

    return this.resolve(async (fsConfig: FileSystemConfig, vfs: VinylFS) => {
      const input = (source: AsyncGenerator<Vinyl>) => pump(source, vinylContents, tIn);
      const output = (source: AsyncGenerator<any>) => pump(source, tOut);

      return {
        seed: fs.existsSync(path) ? input(vfs.src(path)) : generateOne([]),
        input: fsConfig.watch ? input(vfs.watch(path, ['add', 'change', 'unlink'])) : undefined,
        output: source => writeToStream(output(source), fs.createWriteStream(path)),
      };
    });
  }
}

export const fsFile = (config: FileStreamConfig) => new LocalFileConfigFactory(config);

/**
 * A collection based on a single file on the filesystem
 */
export const bundle = (config: BundleConfig) => new BundleFactory(config);
