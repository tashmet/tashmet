import {AsyncFactory} from '@ziqquratu/core';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {ShardStreamConfig, ShardStreamFactory} from '../collections/shard';
import {File, FileAccess} from '../interfaces'
import {pipe, pump, fileReader, transformInput, filter, Transform, transformOutput} from '../pipes';

export interface FileContentConfig {
  serializer?: IOGate<Pipe>;

  extract?: boolean;
}

export interface DirectoryStreamConfig {
  path: string;

  extension: string;

  driver: AsyncFactory<FileAccess>;

  content?: FileContentConfig | boolean;
}

export class DirectoryStreamFactory extends ShardStreamFactory {
  public constructor(private config: DirectoryStreamConfig) {
    super()
  }

  public async create(): Promise<ShardStreamConfig> {
    const {path, content, extension} = this.config;
    const driver = await this.config.driver.create();
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const resolveId = ((file: File) => nodePath.basename(file.path).split('.')[0])
    const resolvePath = ((doc: any) => nodePath.join(path, fileName(doc)));

    const tIn: Transform[] = [];
    const tOut: Transform[] = [];

    if (content) {
      tIn.push(
        fileReader,
        filter<File>(async file => !file.isDir),
      );
      if (typeof content !== 'boolean' && content.serializer) {
        tIn.push(transformInput([content.serializer], 'content'));

        if (content.extract) {
          tIn.push(
            pipe<File>(async file => {
              return resolveId
                ? {...file, content: Object.assign({}, file.content, {_id: resolveId(file)})}
                : file;
            }),
            pipe<File>(async file => file.content),
          );
          tOut.push(
            pipe<any, File>(async doc => ({path: resolvePath(doc), content: doc, isDir: false})),
          )
        }
        tOut.push(transformOutput([content.serializer], 'content'));
      }
    }

    const input = (gen: AsyncGenerator<File>) => pump<File, any>(gen, ...tIn);
    const output = (gen: AsyncGenerator<any>) => pump<any, File>(gen, ...tOut);

    return {
      seed: input(driver.read(path)),
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

export const directory = (config: DirectoryStreamConfig) => 
  new DirectoryStreamFactory(config);
