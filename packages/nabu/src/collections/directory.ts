import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {shards, ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, FileAccess, ReadableFile, FileContentConfig, PartialBy} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export interface GlobConfig<T> {
  pattern: string;

  driver: AsyncFactory<FileAccess>;

  resolveId?: Pipe<File<T>, string>;
}

export interface GlobFilesConfig<T = any, TStored = T> extends GlobConfig<T> {
  content?: FileContentConfig<T, TStored> | boolean;
}

export interface GlobContentConfig<T = any, TStored = T> extends
  GlobConfig<T>,
  FileContentConfig<T, TStored>
{
  resolvePath?: Pipe<T, string>;
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

export const globResolvePath: Pipe<any, string> = async doc => doc._id
export const globResolveId: Pipe<File, string> = async file => file.path;

export class GlobStreamFactory<T> extends ShardStreamFactory<T> {
  public constructor(protected config: GlobFilesConfig<any>) {
    super()
  }

  public async create(): Promise<ShardStreamConfig<any>> {
    const {pattern, content} = this.config;
    const driver = await this.config.driver.create();

    const input = (source: Generator<File>) => {
      if (!content) {
        return source;
      }
      if (typeof content !== 'boolean') {
        return this.contentParser(this.fileReader(source), content);
      }
      return this.fileReader(source);
    }

    const output = (source: Generator<any>) => content && typeof content !== 'boolean'
      ? this.contentSerializer(source, content)
      : source;

    const watch = driver.watch(pattern);
    const watchDelete = driver.watch(pattern, true);

    return {
      seed: input(driver.read(pattern)),
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

  private fileReader(source: Generator<ReadableFile>) {
    return source
      .pipe(Pipes.filter(async file => !file.isDir))
      .pipe(Pipes.File.read())
  }

  private contentParser(source: Generator<File<Buffer>>, content: FileContentConfig<any>) {
    const resolveId = this.config.resolveId || globResolveId;

    return source
      .pipe(Pipes.File.parse(content.serializer))
      .pipe(Pipes.File.assignContent(file => ({_id: resolveId(file)})))
      .pipe(content.afterParse || Pipes.identity())
  }

  private contentSerializer(source: Generator<File<any>>, content: FileContentConfig<any>) {
    return source
      .pipe(Pipes.onKey('content', Pipes.omitKeys('_id')))
      .pipe(content.beforeSerialize || Pipes.identity<T>())
      .pipe(Pipes.File.serialize(content.serializer));
  }
}


export class GlobContentStreamFactory<T> extends GlobStreamFactory<T> {
  protected resolvePath: Pipe<T, string>;

  public constructor({pattern, driver, resolveId, resolvePath, ...content}: GlobContentConfig<any>) {
    super({pattern, driver, content, resolveId});
    this.resolvePath = resolvePath || globResolvePath;
  }

  public async create(): Promise<ShardStreamConfig<any>> {
    const stream = await super.create();

    const input = (source: Generator<File<T>>) =>
      source.pipe(Pipes.File.content());

    const output = (source: Generator<T>) =>
      source.pipe(Pipes.File.create(this.resolvePath));

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
export function directoryFiles<T = any, TStored = T>({path, extension, driver}: DirectoryFilesConfig<T, TStored>) {
  const resolveId = async (file: File) => nodePath.basename(file.path).split('.')[0]

  return shards<File<T>>({
    stream: new GlobStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      resolveId,
    })
  });
}

export function directoryContent<T = any, TStored = T>({path, extension, driver, serializer}: DirectoryContentConfig<T, TStored>) {
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const resolvePath = async (doc: any) => nodePath.join(path, fileName(doc));

  return shards<T>({
    stream: new GlobContentStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      serializer,
      resolvePath,
    }),
  });
}
