import {FileSystemConfig} from '../interfaces';
import Vinyl from 'vinyl';
import {BundleStreamFactory} from './bundle';
import {pump, vinylContents, writeToStream, Transform} from '../pipes';
import * as fs from 'fs';
import {VinylFS} from '../vinyl/fs';

export interface FileStreamConfig {
  /**
   * Path to file.
   */
  path: string;
}

export class LocalFileConfigFactory extends BundleStreamFactory {
  public constructor(private config: FileStreamConfig) {
    super('nabu.FileSystemConfig', VinylFS)
  }

  public async create(tIn: Transform, tOut: Transform) {
    const {path} = this.config;

    return this.resolve(async (fsConfig: FileSystemConfig, vfs: VinylFS) => {
      const input = (source: AsyncGenerator<Vinyl>) => pump(source, vinylContents, tIn) as AsyncGenerator<any[]>
      const output = (source: AsyncGenerator<any[]>) => pump(source, tOut);

      return {
        seed: fs.existsSync(path) ? input(vfs.src(path)) : undefined,
        input: fsConfig.watch ? input(vfs.watch(path, ['add', 'change', 'unlink'])) : undefined,
        output: source => writeToStream(output(source), fs.createWriteStream(path)),
      };
    });
  }
}

export const fsFile = (config: FileStreamConfig) => new LocalFileConfigFactory(config);
