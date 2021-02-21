import {AsyncFactory} from '@ziqquratu/core';
import {BundleStreamConfig, BundleStreamFactory} from '../collections/bundle';
import {File, FileAccess} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export interface FileStreamConfig {
  path: string;

  driver: AsyncFactory<FileAccess>;
}

export class FileStreamFactory extends BundleStreamFactory<Buffer> {
  public constructor(private config: FileStreamConfig) {
    super()
  }

  public async create(): Promise<BundleStreamConfig<Buffer>> {
    const {path} = this.config;
    const driver = await this.config.driver.create();

    const input = (gen: AsyncGenerator<File>) => new Generator(gen)
      .pipe(Pipes.File.read())
      .pipe(Pipes.File.content());
    const output = (gen: AsyncGenerator<any>) => new Generator(gen)
      .pipe(Pipes.File.create(path));

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
