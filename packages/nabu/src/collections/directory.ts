import {DuplexTransformFactory, FileSystemConfig} from '../interfaces';
import {buffer, BufferStreamMode} from './buffer';
import {vinylFSWatcher, vinylReader, vinylWriter} from '../pipes';
import * as fs from 'fs-extra';
import * as vfs from 'vinyl-fs';
import * as nodePath from 'path';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import pipe from 'pipeline-pipe';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';

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
    const {path, extension, serializer, create} = this.config;
    const fileName = (doc: any) => `${doc._id}.${extension}`;
    const glob = `${path}/*.${extension}`;
    const transforms = [serializer];

    if (!fs.existsSync(path) && create) {
      fs.mkdirpSync(path);
    }

    return this.resolve((fsConfig: FileSystemConfig, watcher: chokidar.FSWatcher) => {
      watcher.add(path);

      const input = (source: stream.Readable) => vinylReader({
        source, transforms, id: file => nodePath.basename(file.path).split('.')[0],
      });

      return buffer({
        bundle: false,
        io: {
          createReadable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return input(vinylFSWatcher({glob, watcher, events: ['add', 'change']}));
              case BufferStreamMode.Seed:
                return input(vfs.src(glob) as stream.Transform)
              case BufferStreamMode.Delete:
                return input(vinylFSWatcher({glob, watcher, events: ['unlink']}));
            }
          },
          createWritable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return vinylWriter({
                  destination: vfs.dest(path) as stream.Transform,
                  transforms,
                  path: fileName,
                });
              case BufferStreamMode.Delete:
                return pipe(async doc => {
                  const filePath = nodePath.join(path, fileName(doc));
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                  }
                });
            }
          }
        },
      }).create(name, database);
    })
  }
}

/**
 * A collection based on files in a directory on the filesystem
 */
export const directory = (config: DirectoryConfig) => new DirectoryFactory(config);
