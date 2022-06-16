import {
  Comparator,
  Container,
  Logger,
  provider,
} from '@tashmet/tashmet';
import { MemoryStorageEngine, MingoDatabaseEngine } from '@tashmet/mingo-engine';
import { DatabaseEngine, Document } from '@tashmet/engine';
import Mingo from '@tashmet/mingo';

import {File, FileAccess} from './interfaces';

export * from './interfaces';
export {json} from './operators/json';
export {yaml} from './operators/yaml';

import { useOperators, OperatorType } from 'mingo/core';
import { $jsonParse, $jsonDump } from './operators/json';
import { $yamlParse, $yamlDump } from './operators/yaml';

import { Stream } from './generators/stream';
import { FileStream, DocumentStream, Writable } from './generators/interfaces';
import { BufferDatabaseEngine } from './collections/buffer';
import { FileBufferStorageEngine } from './storageEngine';

useOperators(OperatorType.PIPELINE, { $yamlParse, $yamlDump });
useOperators(OperatorType.EXPRESSION, { $jsonParse, $jsonDump });

@provider()
export default class Nabu {
  public static configure() {
    return (container: Container) => {
      container.register(Nabu);
    }
  }

  public constructor(
    private memory: Mingo,
    private logger: Logger,
    private fileAccess: FileAccess,
    private comparator: Comparator,
  ) {}

  /*
  public async write(documents: Document[] | AsyncIterable<File<Buffer>>) {
    return this.fileAccess.write(Pipeline.fromMany(documents as any));
  }
  */
  public async *write(path?: string): Writable<File<Buffer>> {
    while (true) {
      const file = yield;
      console.log(file);
    }
  }

  public read(pathOrGlob: string): FileStream {
    return new Stream(this.fileAccess.read(pathOrGlob));
  }

  public generate<TSchema extends Document>(docs: TSchema[]): DocumentStream<TSchema> {
    return Stream.fromArray(docs);
  }

  public fileBuffer(dbName: string): DatabaseEngine {
    const buffer = new MemoryStorageEngine(dbName);
    const bufferEngine = MingoDatabaseEngine.fromMemory(buffer);
    const store = new FileBufferStorageEngine(dbName, buffer, this.fileAccess);
    return new BufferDatabaseEngine(bufferEngine, store);
  }

  /**
   * A collection based on files in a directory on a file-system
   *
   * @param config
   */
/*
  public directoryFiles<T = any, TStored = T>({path, extension, ...config}: DirectoryFilesConfig<T, TStored> & StoreConfig) {
    return this.shards<File<T>>(
      config, ShardStream.fromGlobFiles({pattern: extension ? `${path}/*.${extension}` : `${path}/*`}, this.fileAccess))
  }
  */

  /**
   * A collection based on content in files in a directory on a file system
   *
   * @param config
   */
/*
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
  */

  /**
   * A collection based on files matching a glob pattern on a file system
   *
   * @param config
   */
  /*
  public globFiles<T = any, TStored = T>({pattern, content, ...storeConfig}: GlobFilesConfig<T, TStored> & StoreConfig) {
    return this.shards<File<T>>(storeConfig, ShardStream.fromGlobFiles({pattern, content}, this.fileAccess));
  }
  */

  /**
   * A collection based on content in files matching a glob pattern on a file system
   *
   * @param config
   */
  /*
  public globContent<T extends Document = any, TStored = T>(config: GlobContentConfig<T, TStored> & StoreConfig) {
    return this.shards<T>(config, ShardStream.fromGlobContent<T, TStored>(config, this.fileAccess));
  }
  */

  /*
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
  */
}
