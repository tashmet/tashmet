import {Factory} from '@tashmit/core';
import {Pipe} from '@tashmit/pipe';
import {bundle, BundleStreamConfig, BundleStreamFactory} from '../collections/bundle';
import {FileStreamConfig, ReadableFile, Serializer} from '../interfaces'
import * as Pipes from '../pipes';
import {Pipeline} from '../pipeline';

export interface FileConfig<T extends object, TStored = T> extends FileStreamConfig<T> {
  /**
   * Path to the file containing the collection.
   */
  path: string;

  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer: Serializer<TStored[] | Record<string, TStored>>;

  /**
   * Stream the collection as a dictionary instead of a list
   *
   * If set the collection will be streamed as a dictionary with keys
   * being the IDs of each document.
   *
   * @default false
   */
  dictionary?: boolean;

  /**
   * An optional pipe that can modify incoming documents after they have been parsed.
   */
  afterParse?: Pipe<TStored, T>;

  /**
   * An optional pipe that can modify outgoing documents before the they are
   * serialized and written to the file system.
   *
   * This is a good opportunity to, for instance, remove run-time data that
   * does not need to be persisted.
   */
  beforeSerialize?: Pipe<T, TStored>;
}

export function file<T extends object = any, TStored extends object = T>(
  config: FileConfig<T, TStored>
) {
  const streamFactory: BundleStreamFactory<T> = Factory.of(async ({container}) => {
    const {path, serializer, dictionary, afterParse, beforeSerialize} = config;
    const driver = await config.driver.resolve(container)({});

    const input = (source: Pipeline<ReadableFile>) => source
      .pipe(Pipes.File.read())
      .pipe(Pipes.File.parse(serializer))
      .pipe(Pipes.File.content())
      .pipe(dictionary ? Pipes.toList<TStored>() : Pipes.identity<TStored>())
      .pipe(Pipes.disperse())
      .pipe(afterParse || Pipes.identity<T>())

    const output = (source: Pipeline<T>) => source
      .pipe(beforeSerialize || Pipes.identity())
      .pipe(Pipes.collect())
      .pipe(dictionary ? Pipes.toDict<TStored>() : Pipes.identity<TStored>())
      .pipe(Pipes.File.create(path))
      .pipe(Pipes.File.serialize(serializer));

    const watch = driver.watch(path);

    return {
      seed: input(driver.read(path)),
      input: watch ? input(watch) : undefined,
      output: (source) => driver.write(output(source)),
    } as BundleStreamConfig<T>;
  });

  return bundle<T>({stream: streamFactory});
}

