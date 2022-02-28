import * as nodePath from 'path';
import {Logger} from '@tashmit/core';
import {ChangeSet, Collection, Database, Document, locked, withMiddleware, MemoryDriver} from '@tashmit/database';
import {BundleDriver, BundleStreamConfig } from './collections/bundle';

import {File, FileAccess, ReadableFile, Pipe, FileConfig, DirectoryContentConfig, DirectoryFilesConfig} from './interfaces';
import {Pipeline} from './pipeline';
import * as Pipes from './pipes';
import {GlobFilesConfig, GlobContentConfig, ShardStream, ShardDriver} from './collections/shard';


export class FileSystemDatabase extends Database {
  private buffers: Record<string, MemoryDriver<any>> = {};

  public constructor(
    name: string,
    private logger: Logger,
    private fileAccess: FileAccess,
  ) { super(name); }

  public file<T extends object = any, TStored extends object = T>(name: string, config: FileConfig<T, TStored>): Collection<T> {
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

    const buffer = this.createBuffer<T>(name);
    const driver = new BundleDriver(buffer, streamConfig.output);
    const collection = new Collection<T>(driver);

    const listen = async (input: Pipeline<T>) => {
      return driver.load(ChangeSet.fromDiff(await buffer.find().toArray(), await input.toArray()));
    }

    if (streamConfig.input) {
      listen(streamConfig.input);
    }
    return withMiddleware<T>(collection, [locked([driver.populate(streamConfig.seed)])])
  }

  /**
   * A collection based on files in a directory on a file-system
   *
   * @param config
   */
  public directoryFiles<T = any, TStored = T>(name: string, {path, extension}: DirectoryFilesConfig<T, TStored>) {
    return this.shards<File<T>>(
      name, ShardStream.fromGlobFiles({pattern: extension ? `${path}/*.${extension}` : `${path}/*`}, this.fileAccess))
  }

  /**
   * A collection based on content in files in a directory on a file system
   *
   * @param config
   */
  public directoryContent<T extends Document = any, TStored = T>(
    name: string, {path, extension, serializer, resolveId, resolvePath}: DirectoryContentConfig<T, TStored>)
  {
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const defaultPathResolver = async (doc: any) => nodePath.join(path, fileName(doc));
    const defaultIdResolver: Pipe<File, string> = async file =>
      nodePath.basename(file.path).split('.')[0]

    return this.shards<T>(
      name,
      ShardStream.fromGlobContent({
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
  public globFiles<T = any, TStored = T>(name: string, config: GlobFilesConfig<T, TStored>) {
    return this.shards<File<T>>(name, ShardStream.fromGlobFiles(config, this.fileAccess));
  }

  /**
   * A collection based on content in files matching a glob pattern on a file system
   *
   * @param config
   */
  public globContent<T extends Document = any, TStored = T>(name: string, config: GlobContentConfig<T, TStored>) {
    return this.shards<T>(name, ShardStream.fromGlobContent<T, TStored>(config, this.fileAccess));
  }


  private shards<T extends Document = any>(name: string, {seed, input, inputDelete, output}: ShardStream<T>): Collection<T> {
    const eachDocument = async (source: Pipeline, fn: (doc: any) => Promise<any>) => {
      for await (const doc of source) {
        await fn(doc);
      }
    }

    const driver = new ShardDriver(this.createBuffer<T>(name), output);
    const collection = new Collection<T>(driver);
    const instance = withMiddleware<T>(collection, [locked([driver.populate(seed)])])

    if (input) {
      eachDocument(input, doc => driver.load(ChangeSet.fromInsert([doc])));
    }
    if (inputDelete) {
      eachDocument(inputDelete, doc => driver.load(ChangeSet.fromDelete([doc])));
    }
    return instance;
  }

  private createBuffer<T>(name: string): MemoryDriver<T> {
    return this.buffers[name] = MemoryDriver.fromConfig<T>({
      ns: {db: this.name, coll: name},
      collectionResolver: (name: string) => this.buffers[name].documents
    });
  }
}
