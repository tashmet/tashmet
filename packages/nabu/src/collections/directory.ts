import {StreamFactory, DuplexTransformFactory, FileSystemConfig} from '../interfaces';
import {buffer} from './buffer';
import {vinylFSWatcher, vinylReader, vinylWriter} from '../pipes';
import * as fs from 'fs';
import * as nodePath from 'path';
import * as stream from 'stream';
import pipe from 'pipeline-pipe';
import * as vfs from 'vinyl-fs';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';
import Vinyl from 'vinyl';
import * as chokidar from 'chokidar';

export interface DirectoryConfig {
  /**
   * Path to directory.
   */
  path: string;

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  /**
   * file extension of files in the directory.
   */
  extension: string;

  /**
   * When set to true the directory will be created if it does not exist.
   * (false by default).
   */
  create?: boolean;
}

export class DirectoryFactory extends CollectionFactory {
  public constructor(private config: DirectoryConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher')
  }

  public async create(name: string, database: Database) {
    const {path, extension, serializer} = this.config;

    return this.resolve((fsConfig: FileSystemConfig, watcher: chokidar.FSWatcher) => {
      const fileName = (doc: any) => `${doc._id}.${extension}`;
      const glob = `${path}/*.${extension}`;
      const id = (file: Vinyl) => nodePath.basename(file.path).split('.')[0]
      const transforms = [serializer];

      return buffer({
        io: {
          createReadable() {
            return vinylReader({
              source: vinylFSWatcher({glob, watcher}),
              transforms,
              id
            });
          },
          createWritable() {
            return vinylWriter({
              destination: vfs.dest(path) as stream.Transform,
              transforms,
              path: fileName,
            });
          }
        },
        seed: vinylReader({
          source: vfs.src(glob) as stream.Duplex,
          transforms,
          id: id,
        }),
        deletion: ({
          createReadable: () => new stream.Readable(),
          createWritable: () => pipe(async doc => {
            const filePath = nodePath.join(path, fileName(doc));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          })
        }) as StreamFactory,
      }).create(name, database);
    })
  }
}

/**
 * A collection based on files in a directory on the filesystem
 */
export const directory = ({path, extension, serializer}: DirectoryConfig) => {
  return new DirectoryFactory({path, extension, serializer});
}
