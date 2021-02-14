import {buffer, BufferStreamMode} from './buffer';
import {ipfsReader, IPFSReaderConfig} from '../pipes';
import * as stream from 'stream';
import pipe from 'pipeline-pipe';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';

const pumpify = require('pumpify');

export interface IPFSConfig {
  cid: string | string[];

  transformer?: IPFSReaderConfig,
}

export class IPFSFactory extends CollectionFactory {
  public constructor(private config: IPFSConfig) {
    super('ipfs')
  }

  public async create(name: string, database: Database) {
    const {cid, transformer} = this.config;

    return this.resolve((ipfs: any) => {
      const input = (readable: stream.Readable) => transformer
        ? pumpify.obj(readable, ipfsReader(transformer))
        : readable;
      /*
      const vinylSrcOpts: vfs.SrcOptions = pick(this.config, 'buffer', 'read');

      const output = (writable: stream.Readable) => transformer
        ? pumpify.obj(vinylWriter(transformer), writable) : writable;

      const watch = (...events: string[]) => vinylFSWatcher(Object.assign({glob: source, watcher, events}, vinylSrcOpts));
*/
      return buffer({
        bundle: false,
        io: {
          createReadable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Seed:
                return input(stream.Readable.from(ipfs.get(cid), {objectMode: true}));
            }
            return new stream.Readable({objectMode: true, read() {}});
          },
          createWritable(mode: BufferStreamMode) {
            /*
            switch (mode) {
              case BufferStreamMode.Update:
                return output(vfs.dest(destination || '.') as stream.Transform);
              case BufferStreamMode.Delete:
                return output(pipe(async (file: Vinyl) => {
                  if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                  }
                }));
            }
            */
            return new stream.Writable({objectMode: true, write: (data) => console.log(data)});
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
