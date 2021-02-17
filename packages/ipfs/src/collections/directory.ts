import {ShardStreamConfig, ShardStreamFactory, pump} from '@ziqquratu/nabu';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import {ipfsReader, ipfsWriter} from '../pipes';
import * as nodePath from 'path';

export interface IPFSConfig {
  path: string;

  /** A function to determine the ID of a document read */
  resolveId?: (file: any) => string; 

  /** A function returning the file path given a document on write */
  resolvePath: (doc: any) => string;
}

export class IPFSStreamFactory extends ShardStreamFactory {
  public constructor(private config: IPFSConfig) {
    super('ipfs.Client')
  }

  public async create(transforms: IOGate<Pipe>[]): Promise<ShardStreamConfig> {
    const {path, resolveId, resolvePath} = this.config;

    return this.resolve(async (ipfs: any) => {
      try {
        await ipfs.files.mkdir(path);
      } catch (err) {
        // Directory already exists, do nothing.
      }
      const stat = await ipfs.files.stat(path);

      const input = (gen: AsyncGenerator) => transforms.length > 0
        ? pump(gen, ...ipfsReader(transforms, resolveId))
        : gen;

      const output = (gen: AsyncGenerator): AsyncGenerator<any> => transforms.length > 0
        ? pump(gen, ...ipfsWriter(transforms, resolvePath))
        : gen;

      return {
        seed: input(ipfs.get(stat.cid)),
        output: async (source, deletion) => {
          for await (const file of output(source)) {
            if (deletion) {
              await ipfs.files.rm(file.path);
            } else {
              await ipfs.files.write(file.path, file.content, {create: true});
            }
          }
        }
      };
    })
  }
}

export interface IPFSDirectoryConfig {
  path: string;

  extension: string;
}

/**
 * A collection based on files in a directory on the interplanetary file system
 */
export const ipfsDirectory = ({path, extension}: IPFSDirectoryConfig) => 
  new IPFSStreamFactory({
    path,
    resolveId: file => nodePath.basename(file.path).split('.')[0],
    resolvePath: doc => `${path}/${doc._id}.${extension}`,
  });
