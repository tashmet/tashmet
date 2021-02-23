import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {shards, ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, FileAccess, Serializer} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface FileContentConfig<T, TStored = T> {
  /**
   * The serializer used to parsing and serializing the content, ie json() or yaml().
   */
  serializer: Serializer<TStored>;

  /**
   * An optional pipe that can modify incoming files (and their content)
   * after the content has been parsed.
   */
  afterParse?: Pipe<File<TStored>, File<T>>;

  /**
   * An optional pipe that can modify outgoing files (and their content)
   * before the content is serialized and written to the file system.
   * 
   * This is a good opportunity to, for instance, remove run-time data that
   * does not need to be persisted.
   */
  beforeSerialize?: Pipe<File<T>, File<TStored>>;
}

export interface DirectoryConfig {
  /**
   * Path to the directory to where the files reside
   */
  path: string;

  /**
   * Extension of the files.
   * 
   * Should be provided without a dot, ie 'json' or 'yaml' etc. This both serves
   * as a filter for incoming files, as well as a basis for determining the 
   * name of outgoing files if the content is extracted.
   */
  extension: string;

  /**
   * The underlying file system driver to use.
   */
  driver: AsyncFactory<FileAccess>;

}

export interface DirectoryFilesConfig<T = any, TStored = T> extends
  PartialBy<DirectoryConfig, 'extension'>
{
  /**
   * Strategy for reading and writing content
   * 
   * When set to false, content will be an async generator that can be consumed
   * at a later point and when true the content will be read into a buffer.
   * 
   * If the content should be parsed a configuration for how to do that can be
   * given instead.
   */
  content?: FileContentConfig<T, TStored> | boolean;
}

export interface DirectoryContentConfig<T = any, TStored = T> extends
  DirectoryConfig,
  FileContentConfig<T, TStored>
{}

export class DirectoryStreamFactory<T> extends ShardStreamFactory<T> {
  public constructor(protected config: DirectoryFilesConfig<any>) {
    super()
  }

  public async create(): Promise<ShardStreamConfig<any>> {
    const {path, content, extension} = this.config;
    const driver = await this.config.driver.create();
    const resolveId = (file: File) => nodePath.basename(file.path).split('.')[0];
    const glob = extension ? `${path}/*.${extension}` : `${path}/*`;

    const input = (source: Generator<File>) => {
      if (!content) {
        return source;
      }

      source = source
        .pipe(Pipes.filter(async file => !file.isDir))
        .pipe(Pipes.File.read())

      if (content && typeof content !== 'boolean') {
        source = source
          .pipe(Pipes.File.parse(content.serializer))
          .pipe(Pipes.File.assignContent(file => ({_id: resolveId(file)})))
          .pipe(content.afterParse || Pipes.identity())
      }
      return source;
    }

    const output = (source: Generator<any>) => {
      if (content && typeof content !== 'boolean') {
        return source
          .pipe(Pipes.onKey('content', Pipes.omitKeys('_id')))
          .pipe(content.beforeSerialize || Pipes.identity<T>())
          .pipe(Pipes.File.serialize(content.serializer));
      }
      return source;
    }

    const watch = driver.watch(glob);
    const watchDelete = driver.watch(glob, true);

    return {
      seed: input(driver.read(glob)),
      input: watch ? input(watch) : undefined,
      inputDelete: watchDelete ? input(watchDelete) : undefined,
      output: async (source, deletion) => {
        const files = output(source);
        if (deletion) {
          await driver.remove(files);
        } else {
          await driver.write(files);
        }
      }
    };
  }
}

export class DirectoryContentStreamFactory<T> extends DirectoryStreamFactory<T> {
  public constructor({path, extension, driver, ...content}: DirectoryContentConfig<any>) {
    super({path: path, extension: extension, driver: driver, content: content});
  }

  public async create(): Promise<ShardStreamConfig<any>> {
    const {path,  extension} = this.config;
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const stream = await super.create();
    const resolvePath = (doc: any) => nodePath.join(path, fileName(doc));

    const input = (source: Generator<File<T>>) =>
      source.pipe(Pipes.File.content());

    const output = (source: Generator<T>) =>
      source.pipe(Pipes.File.create(resolvePath));

    return {
      seed: stream.seed ? input(stream.seed) : undefined,
      input: stream.input ? input(stream.input) : undefined,
      output: (source, deletion) => stream.output(output(source), deletion),
    }
  }
}

/**
 * A collection based on files in a directory on a file-system
 * 
 * @param config 
 */
export function directoryFiles<T = any, TStored = T>(config: DirectoryFilesConfig<T, TStored>) {
  return shards<File<T>>({
    stream: new DirectoryStreamFactory(config)
  });
}

export function directoryContent<T = any, TStored = T>(config: DirectoryContentConfig<T, TStored>) {
  return shards<T>({
    stream: new DirectoryContentStreamFactory(config),
  });
}
