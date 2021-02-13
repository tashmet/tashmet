import {DuplexTransformFactory, FileSystemConfig} from '../interfaces';
import {buffer, BufferStreamMode} from './buffer';
import {chainOutput, dict, vinylFSWatcher, vinylReader} from '../pipes';
import * as fs from 'fs';
import * as vfs from 'vinyl-fs';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import { CollectionFactory, Database } from '@ziqquratu/ziqquratu';

const pumpify = require('pumpify');

export interface FileConfig {
  /**
   * Path to file.
   */
  path: string;

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  /**
   * Store the collection as a dictionary instead of a list
   * 
   * If set the collection will be stored as a dictionary on disk with keys
   * being the IDs of each document.
   */
  dictionary: boolean;
}

export class FileFactory extends CollectionFactory {
  public constructor(private config: FileConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher')
  }

  public async create(name: string, database: Database) {
    const {path, serializer, dictionary} = this.config;
    const transforms: DuplexTransformFactory[] = [serializer];

    return this.resolve((fsConfig: FileSystemConfig, watcher: chokidar.FSWatcher) => {
      if (fsConfig.watch) {
        watcher.add(path);
      }
      if (dictionary) {
        transforms.push(dict());
      }

      return buffer({
        bundle: true,
        io: {
          createReadable: (mode: BufferStreamMode) => {
            switch (mode) {
              case BufferStreamMode.Seed:
                if (fs.existsSync(path)) {
                  return pumpify.obj(vfs.src(path), vinylReader({transforms}));
                }
                return stream.Readable.from([]);
              case BufferStreamMode.Update:
                return pumpify.obj(
                  vinylFSWatcher({glob: path, watcher, events: ['add', 'change', 'unlink']}),
                  vinylReader({transforms})
                );
            }
          },
          createWritable: () => {
            return pumpify.obj(
              chainOutput(transforms),
              fs.createWriteStream(path, 'utf-8')
            );
          }
        }
      }).create(name, database);
    });
  }
}
/**
 * A collection based on a single file on the filesystem
 */
export const file = (config: FileConfig) => new FileFactory(config);
