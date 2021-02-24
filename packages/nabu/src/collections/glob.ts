import {Pipe} from '@ziqquratu/pipe';
import {shards, ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, ReadableFile, FileContentConfig, MultiFilesWithContentConfig, MultiFilesConfig, ExtractedFileContentConfig} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export type GlobFilesConfig<T = any, TStored = T> = GlobConfig<T> & MultiFilesWithContentConfig<T, TStored>;

export interface GlobConfig<T> extends MultiFilesConfig<T> {
  pattern: string;
}

export type GlobContentConfig<T = any, TStored = T> =
  GlobConfig<T> & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;

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
    return source
      .pipe(Pipes.File.parse(content.serializer))
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
  protected resolveId: Pipe<File<any>, string>;

  public constructor({pattern, driver, resolveId, resolvePath, ...content}: GlobContentConfig<any>) {
    super({pattern, driver, content});
    this.resolvePath = resolvePath || globResolvePath;
    this.resolveId = resolveId || globResolveId;
  }

  public async create(): Promise<ShardStreamConfig<any>> {
    const stream = await super.create();

    const input = (source: Generator<File<T>>) => source
      .pipe(Pipes.File.assignContent(async file => ({_id: await this.resolveId(file)})))
      .pipe(Pipes.File.content());

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
 * A collection based on files matching a glob pattern on a file system
 *
 * @param config
 */
export function globFiles<T = any, TStored = T>(config: GlobFilesConfig<T, TStored>) {
  return shards<File<T>>({
    stream: new GlobStreamFactory(config)
  });
}

/**
 * A collection based on content in files matching a glob pattern on a file system
 *
 * @param config
 */
export function globContent<T = any, TStored = T>(config: GlobContentConfig<T, TStored>) {
  return shards<T>({
    stream: new GlobContentStreamFactory(config),
  });
}
