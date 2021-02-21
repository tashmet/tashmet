import {AsyncFactory} from '@ziqquratu/core';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {shards, ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, FileAccess} from '../interfaces'
import * as Pipes from '../pipes';
import {Generator} from '../generator';

export interface FileContentConfig<T> {
  serializer?: IOGate<Pipe>;

  extract?: boolean;

  afterParse?: Pipe<File<T>>;

  beforeSerialize?: Pipe<File<T>>;
}

export interface DirectoryConfig<T> {
  path: string;

  extension: string;

  driver: AsyncFactory<FileAccess>;

  content?: FileContentConfig<T> | boolean;
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
    const glob = `${path}/*.${extension}`;

    const input = (source: AsyncGenerator<File>) => {
      let gen = new Generator(source);

      if (content) {
        gen = gen.filter(async file => !file.isDir).pipe(Pipes.File.read());

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

export function directory<T = any>(config: DirectoryConfig<T>) {
  return shards<T>({
    stream: new DirectoryStreamFactory(config)
  });
}
