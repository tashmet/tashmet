import {Factory} from '@tashmit/core';
import {Pipe} from '@tashmit/pipe';
import {shards, ShardStreamConfig, ShardStreamFactory} from './shard';
import {File, ReadableFile, FileContentConfig, MultiFilesWithContentConfig, FileStreamConfig, ExtractedFileContentConfig} from '../interfaces'
import * as Pipes from '../pipes';
import {Pipeline} from '../pipeline';

export type GlobFilesConfig<T = any, TStored = T> = GlobConfig<T> & MultiFilesWithContentConfig<T, TStored>;

export interface GlobConfig<T> extends FileStreamConfig<T> {
  pattern: string;
}

export type GlobContentConfig<T = any, TStored = T> =
  GlobConfig<T> & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;

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

export function globFilesStream<T = any, TStored = T>(
  config: GlobFilesConfig<T, TStored>
): ShardStreamFactory<File<T>> {
  return Factory.of(async ({container}) => {
    const {pattern, content} = config;
    const driver = await config.driver.resolve(container)({});

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
    } as ShardStreamConfig<File<T>>
  });
}

/**
 * A collection based on files matching a glob pattern on a file system
 *
 * @param config
 */
export function globFiles<T = any, TStored = T>(config: GlobFilesConfig<T, TStored>) {
  return shards<File<T>>({stream: globFilesStream(config)});
}

const defaultConfig = {resolveId: globResolveId, resolvePath: globResolvePath};

export function globContentStream<T = any, TStored = T>(
  config: GlobContentConfig<T, TStored>
): ShardStreamFactory<T> {
  const {resolveId, resolvePath, pattern, driver, ...content} =
    Object.assign({}, defaultConfig, config);

  return Factory.of(async ({container}) => {
    const stream = await globFilesStream({pattern, driver, content}).resolve(container)({});

    const input = (source: Pipeline<File<T>>) => source
      .pipe(Pipes.File.assignContent(async file => ({_id: await resolveId(file)})))
      .pipe(Pipes.File.content());

    const output = (source: Pipeline<T>) =>
      source.pipe(Pipes.File.create(resolvePath));

    return {
      seed: stream.seed ? input(stream.seed) : undefined,
      input: stream.input ? input(stream.input) : undefined,
      output: (source, deletion) => stream.output(output(source), deletion),
    } as ShardStreamConfig<any>
  });
}

/**
 * A collection based on content in files matching a glob pattern on a file system
 *
 * @param config
 */
export function globContent<T = any, TStored = T>(config: GlobContentConfig<T, TStored>) {
  return shards<T>({stream: globContentStream(config)});
}
