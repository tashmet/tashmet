import * as nodePath from 'path';
import {
  Comparator,
  Container,
  ChangeSet,
  Document,
  locked,
  Logger,
  provider,
  Store,
  StoreConfig,
  withMiddleware,
} from '@tashmet/tashmet';
import MingoStorageEngine from '@tashmet/mingo';
import {BundleStore, BundleStreamConfig } from './collections/bundle';

import {File, FileAccess, ReadableFile, Pipe, FileConfig, DirectoryContentConfig, DirectoryFilesConfig} from './interfaces';
import {Pipeline} from './pipeline';
import * as Pipes from './pipes';
import {GlobFilesConfig, GlobContentConfig, ShardStream, ShardStore} from './collections/shard';

export * from './interfaces';
export * from './pipeline';
export * from './transform';
export * from './gates';
export * as Pipes from './pipes';


@provider()
export default class Nabu {
  public static configure() {
    return (container: Container) => {
      container.register(Nabu);
    }
  }

  public constructor(
    private memory: MingoStorageEngine,
    private logger: Logger,
    private fileAccess: FileAccess,
    private comparator: Comparator,
  ) {}

  public file<T extends object = any, TStored extends object = T>(config: FileConfig<T, TStored> & StoreConfig): Store<T> {
    const {path, serializer, dictionary, afterParse, beforeSerialize} = config;

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

    const watch = this.fileAccess.watch(path);

    const streamConfig = {
      seed: input(this.fileAccess.read(path)),
      input: watch ? input(watch) : undefined,
      output: (source) => this.fileAccess.write(output(source)),
    } as BundleStreamConfig<T>;

    const buffer = this.memory.createStore<T>(config);
    const store = new BundleStore(buffer, streamConfig.output);

    const listen = async (input: Pipeline<T>) => {
      const findResult = await buffer.command({find: buffer.ns.coll, filter: {}});
      return store.load(this.comparator.difference(findResult.cursor.firstBatch, await input.toArray()));
    }

    if (streamConfig.input) {
      listen(streamConfig.input);
    }
    return withMiddleware<T>(store, [locked([store.populate(streamConfig.seed)])])
  }

  /**
   * A collection based on files in a directory on a file-system
   *
   * @param config
   */

  public directoryFiles<T = any, TStored = T>({path, extension, ...config}: DirectoryFilesConfig<T, TStored> & StoreConfig) {
    return this.shards<File<T>>(
      config, ShardStream.fromGlobFiles({pattern: extension ? `${path}/*.${extension}` : `${path}/*`}, this.fileAccess))
  }

  /**
   * A collection based on content in files in a directory on a file system
   *
   * @param config
   */

  public directoryContent<T extends Document = any, TStored = T>(
    {path, extension, serializer, resolveId, resolvePath, ...storeConfig}: DirectoryContentConfig<T, TStored> & StoreConfig)
  {
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const defaultPathResolver = async (doc: any) => nodePath.join(path, fileName(doc));
    const defaultIdResolver: Pipe<File, string> = async file =>
      nodePath.basename(file.path).split('.')[0]

    return this.shards<T>(
      storeConfig,
      ShardStream.fromGlobContent<T, TStored>({
        pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
        serializer,
        resolveId: resolveId || defaultIdResolver,
        resolvePath: resolvePath || defaultPathResolver,
      }, this.fileAccess),
    );
  }

  /**
   * A collection based on files matching a glob pattern on a file system
   *
   * @param config
   */
  public globFiles<T = any, TStored = T>({pattern, content, ...storeConfig}: GlobFilesConfig<T, TStored> & StoreConfig) {
    return this.shards<File<T>>(storeConfig, ShardStream.fromGlobFiles({pattern, content}, this.fileAccess));
  }

  /**
   * A collection based on content in files matching a glob pattern on a file system
   *
   * @param config
   */
  public globContent<T extends Document = any, TStored = T>(config: GlobContentConfig<T, TStored> & StoreConfig) {
    return this.shards<T>(config, ShardStream.fromGlobContent<T, TStored>(config, this.fileAccess));
  }

  private shards<T extends Document = any>(storeConfig: StoreConfig, {seed, input, inputDelete, output}: ShardStream<T>): Store<T> {
    const eachDocument = async (source: Pipeline, fn: (doc: any) => Promise<any>) => {
      for await (const doc of source) {
        await fn(doc);
      }
    }

    const store = new ShardStore(this.memory.createStore<T>(storeConfig), output);

    if (input) {
      eachDocument(input, doc => store.load(ChangeSet.fromInsert([doc])));
    }
    if (inputDelete) {
      eachDocument(inputDelete, doc => store.load(ChangeSet.fromDelete([doc])));
    }
    return withMiddleware<T>(store, [locked([store.populate(seed)])])
  }
}
