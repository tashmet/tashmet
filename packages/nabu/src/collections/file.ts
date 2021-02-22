import {AsyncFactory} from '@ziqquratu/core';
import {bundle, BundleStreamConfig, BundleStreamFactory} from '../collections/bundle';
import {FileAccess, ReadableFile, Serializer} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export interface FileConfig<T extends object> {
  path: string;

  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer: Serializer<T[] | Record<string, T>>;

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

export class FileStreamFactory<T extends object> extends BundleStreamFactory<T> {
  public constructor(private config: FileConfig<T>) {
    super()
  }

  public async create(): Promise<BundleStreamConfig<T>> {
    const {path, serializer, dictionary} = this.config;
    const driver = await this.config.driver.create();

    const input = (source: AsyncGenerator<ReadableFile>) => new Generator(source)
      .pipe(Pipes.File.read())
      .pipe(Pipes.File.parse(serializer))
      .pipe(Pipes.File.content())
      .pipe(dictionary ? Pipes.toList<T>() : Pipes.identity<T>())

    const output = (source: AsyncGenerator<T[]>) => new Generator(source)
      .pipe(dictionary ? Pipes.toDict<T>() : Pipes.identity<T>())
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

export function file<T extends object>(config: FileConfig<T>) {
  return bundle<T>({
    stream: new FileStreamFactory<T>(config)
  });
}
