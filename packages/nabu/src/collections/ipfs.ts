import {DirectoryConfig} from '../interfaces';
import {buffer, BufferStreamMode} from './buffer';
import {ipfsReader, ipfsWriter, IPFSTransformer} from '../pipes';
import * as stream from 'stream';
import pipe from 'pipeline-pipe';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';
import * as nodePath from 'path';

const pumpify = require('pumpify');

export interface IPFSConfig {
  path: string;

  transformer?: IPFSTransformer,
}

export class IPFSFactory extends CollectionFactory {
  public constructor(private config: IPFSConfig) {
    super('ipfs')
  }

  public async create(name: string, database: Database) {
    const {path, transformer} = this.config;

    return this.resolve(async (ipfs: any) => {
      const input = (readable: stream.Readable) => transformer
        ? pumpify.obj(readable, ipfsReader(transformer))
        : readable;
      const output = (writable: stream.Writable) => transformer
        ? pumpify.obj(ipfsWriter(transformer), writable) : writable;

      try {
        await ipfs.files.mkdir(path);
      } catch (err) {
        // Directory already exists, do nothing.
      }
      const stat = await ipfs.files.stat(path);

      return buffer({
        bundle: false,
        seed: ipfs.get(stat.cid),
        io: {
          createReadable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Seed:
                return input(stream.Readable.from(ipfs.get(stat.cid), {objectMode: true}));
            }
            return stream.Readable.from([]);
          },
          createWritable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return output(pipe(data => ipfs.files.write(data.path, data.content, {create: true})))
              case BufferStreamMode.Delete:
                return output(pipe(file => ipfs.files.rm(file.path)));
            }
          }
        },
      }).create(name, database);
    })
  }
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const ipfs = (config: IPFSConfig) => new IPFSFactory(config);


/**
 * A collection based on files in a directory on the filesystem
 */
export const ipfsDirectory = ({path, extension, serializer, create}: DirectoryConfig) => 
  new IPFSFactory({
    path,
    transformer: {
      transforms: [serializer],
      id: file => nodePath.basename(file.path).split('.')[0],
      path: doc => `/yamlposts/${doc._id}.${extension}`,
    }
  });