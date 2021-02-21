import {AsyncFactory} from '@ziqquratu/core';
import {bundle, BundleStreamConfig, BundleStreamFactory} from '../collections/bundle';
import {File, FileAccess} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';
import {IOGate, Pipe} from '@ziqquratu/pipe';

export interface FileConfig {
  path: string;

  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer: IOGate<Pipe>;

  /**
   * Stream the collection as a dictionary instead of a list
   * 
   * If set the collection will be streamed as a dictionary with keys
   * being the IDs of each document.
   * 
   * @default false
   */
  dictionary?: boolean;

  driver: AsyncFactory<FileAccess>;
}

export class FileStreamFactory extends BundleStreamFactory<any> {
  public constructor(private config: FileConfig) {
    super()
  }

  public async create(): Promise<BundleStreamConfig<any>> {
    const {path, serializer, dictionary} = this.config;
    const driver = await this.config.driver.create();

    const input = (source: AsyncGenerator<File>) => new Generator(source)
      .pipe(Pipes.File.read())
      .pipe(Pipes.File.parse(serializer))
      .pipe(Pipes.File.content())
      .pipe(dictionary ? Pipes.toList() : Pipes.identity())

    const output = (source: AsyncGenerator<any>) => new Generator(source)
      .pipe(dictionary ? Pipes.toDict() : Pipes.identity())
      .pipe(Pipes.File.create(path))
      .pipe(Pipes.File.serialize(serializer));

    const watch = driver.watch(path);

    return {
      seed: input(driver.read(path)),
      input: watch ? input(watch) : undefined,
      output: (source) => driver.write(output(source)),
    };
  }
}

export const file = (config: FileConfig) => bundle({
  stream: new FileStreamFactory(config)
});
