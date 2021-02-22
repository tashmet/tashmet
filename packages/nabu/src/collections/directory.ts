import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {shards, ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, FileAccess, Serializer} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export interface FileContentConfig<T, TStored = T> {
  /**
   * The serializer used to parsing and serializing the content, ie json() or yaml().
   */
  serializer?: Serializer<TStored>;

  /**
   * Extract the content from the file object before adding it to the collection
   */
  extract?: boolean;

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

export interface DirectoryConfig<T, TStored = T> {
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
  extension?: string;

  /**
   * The underlying file system driver to use.
   */
  driver: AsyncFactory<FileAccess>;

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

export class DirectoryStreamFactory extends ShardStreamFactory {
  public constructor(private config: DirectoryConfig<any>) {
    super()
  }

  public async create(): Promise<ShardStreamConfig> {
    const {path, content, extension} = this.config;
    const driver = await this.config.driver.create();
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const resolveId = (file: File) => nodePath.basename(file.path).split('.')[0];
    const resolvePath = (doc: any) => nodePath.join(path, fileName(doc));
    const glob = extension ? `${path}/*.${extension}` : path;

    if (!extension && (typeof content !== 'boolean' && content?.extract)) {
      throw Error('"extension" must be set when extracting content');
    }

    const input = (source: AsyncGenerator<File>) => {
      let gen = new Generator(source);

      if (content) {
        gen = gen
          .filter(async file => !file.isDir)
          .pipe(Pipes.File.read());

        if (typeof content !== 'boolean' && content.serializer) {
          gen = gen
            .pipe(Pipes.File.parse(content.serializer))
            .pipe(Pipes.File.assignContent(file => ({_id: resolveId(file)})))
            .pipe(content.afterParse || Pipes.identity())
            .pipe(content.extract ? Pipes.File.content() : Pipes.identity())
        }
      }
      return gen;
    }

    const output = (source: AsyncGenerator<any>) => {
      let gen = new Generator(source);

      if (content && typeof content !== 'boolean' && content.serializer) {
        gen = gen
          .pipe(content.extract ? Pipes.File.create(resolvePath) : Pipes.identity())
          .pipe(Pipes.onKey('content', Pipes.omitKeys('_id')))
          .pipe(content.beforeSerialize || Pipes.identity())
          .pipe(Pipes.File.serialize(content.serializer));
      }
      return gen;
    }

    const watch = driver.watch(glob);
    const watchDelete = driver.watch(glob, true);

    return {
      seed: input(driver.read(`${path}/*.${extension}`)),
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

/**
 * A collection based on files in a directory on a file-system
 * 
 * @param config 
 */
export function directory<T = any, TStored = T>(config: DirectoryConfig<T, TStored>) {
  return shards<T>({
    stream: new DirectoryStreamFactory(config)
  });
}
