import {
  Store,
  ChangeSet,
  Document,
} from '@tashmit/database';
import {
  File,
  FileContentConfig,
  ExtractedFileContentConfig,
  MultiFilesWithContentConfig,
  Pipe,
  ReadableFile,
  ShardOutput,
} from '../interfaces'
import * as Pipes from '../pipes';
import {Pipeline} from '../pipeline';
import {FileAccess} from '..';
import {BufferStore} from './buffer';


export class ShardStore<TSchema> extends BufferStore<TSchema> {
  public constructor(
    buffer: Store<TSchema>,
    public output: ShardOutput<TSchema>,
  ) {
    super(buffer);
  }

  public async persist(cs: ChangeSet<TSchema>) {
    if (cs.deletions.length > 0) {
      await this.output(Pipeline.fromMany(cs.deletions), true);
    }
    if (cs.incoming.length > 0) {
      await this.output(Pipeline.fromMany(cs.incoming), false);
    }
  }
}

export type GlobFilesConfig<T = any, TStored = T> = GlobConfig & MultiFilesWithContentConfig<T, TStored>;

export interface GlobConfig {
  pattern: string;
}

export type GlobContentConfig<T = any, TStored = T> =
  GlobConfig & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;

export const globResolvePath: Pipe<any, string> = async doc => doc._id
export const globResolveId: Pipe<File, string> = async file => file.path;

function fileReader(source: Pipeline<ReadableFile>) {
  return source
    .pipe(Pipes.filter(async file => !file.isDir))
    .parallel(Pipes.File.read())
}

function contentParser(source: Pipeline<File<Buffer>>, content: FileContentConfig<any>) {
  return source
    .parallel(Pipes.File.parse(content.serializer))
    .parallel(content.afterParse || Pipes.identity())
}

function contentSerializer<T>(source: Pipeline<File<any>>, content: FileContentConfig<any>) {
  return source
    .pipe(Pipes.onKey('content', Pipes.omitKeys('_id')))
    .pipe(content.beforeSerialize || Pipes.identity<T>())
    .pipe(Pipes.File.serialize(content.serializer));
}

const defaultConfig = {resolveId: globResolveId, resolvePath: globResolvePath};

export class ShardStream<T> {
  public constructor(
    public readonly output: ShardOutput<T>,
    public readonly seed: Pipeline<T> | undefined,
    public readonly input: Pipeline<T> | undefined,
    public readonly inputDelete: Pipeline<Partial<T>> | undefined,
  ) {}

  public static fromGlobFiles<T = any, TStored = T>(
    config: GlobFilesConfig<T, TStored>,
    fileAccess: FileAccess,
  ): ShardStream<File<T>> {
    const {pattern, content} = config;

    const input = (source: Pipeline<File>) => {
      if (!content) {
        return source;
      }
      if (typeof content !== 'boolean') {
        return contentParser(fileReader(source), content);
      }
      return fileReader(source);
    }

    const output = (source: Pipeline<any>) => content && typeof content !== 'boolean'
      ? contentSerializer<T>(source, content)
      : source;

    const watch = fileAccess.watch(pattern);
    const watchDelete = fileAccess.watch(pattern, true);

    return new ShardStream<File<T>>(
      async (source, deletion) => {
        const files = output(source);
        if (deletion) {
          await fileAccess.remove(files);
        } else {
          await fileAccess.write(files);
        }
      },
      input(fileAccess.read(pattern)),
      watch ? input(watch) : undefined,
      watchDelete ? input(watchDelete) : undefined,
    );
  }

  public static fromGlobContent<T extends Document = any, TStored = T>(
    config: GlobContentConfig<T, TStored>,
    fileAccess: FileAccess,
  ): ShardStream<T> {
    const {resolveId, resolvePath, pattern, ...content} =
    Object.assign({}, defaultConfig, config);

    const stream = ShardStream.fromGlobFiles({pattern, content}, fileAccess);

    const input = (source: Pipeline<File<T>>) => source
      .pipe(Pipes.File.assignContent(async file => ({_id: await resolveId(file)})))
      .pipe(Pipes.File.content());

    const output = (source: Pipeline<T>) =>
      source.pipe(Pipes.File.create(resolvePath));

    return new ShardStream<T>(
      (source, deletion) => stream.output(output(source), deletion),
      stream.seed ? input(stream.seed) : undefined,
      stream.input ? input(stream.input) : undefined,
      undefined,
    );
  }
}