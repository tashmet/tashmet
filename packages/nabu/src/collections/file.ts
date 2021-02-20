import {AsyncFactory} from '@ziqquratu/core';
import {BundleStreamConfig, BundleStreamFactory} from '../collections/bundle';
import {File, FileAccess} from '../interfaces'
import {pipe, pump, toBufferedFile} from '../pipes';

export interface FileStreamConfig {
  path: string;

  driver: AsyncFactory<FileAccess>;
}

export class FileStreamFactory extends BundleStreamFactory {
  public constructor(private config: FileStreamConfig) {
    super()
  }

  public async create(): Promise<BundleStreamConfig> {
    const {path} = this.config;
    const driver = await this.config.driver.create();
    const extractContent = pipe<File, any>(async file => file.content);
    const createFile = pipe<Buffer, File>(async buf => ({path, content: buf, isDir: false}));

    const input = (gen: AsyncGenerator<File>) => pump<File, any>(gen, toBufferedFile(), extractContent);
    const output = (gen: AsyncGenerator<any>) => pump<any, File>(gen, createFile);

    const watch = driver.watch(path);

    return {
      seed: input(driver.read(path)),
      input: watch ? input(watch) : undefined,
      output: (source) => driver.write(output(source)),
    };
  }
}

export const file = (config: FileStreamConfig) => 
  new FileStreamFactory(config);
