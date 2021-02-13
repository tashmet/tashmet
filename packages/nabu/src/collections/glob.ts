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

export interface GlobConfig {
  /**
   * Glob pattern
   */
  pattern: string | string[];

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  /**
   * A function that should return a path where to write a document
   */
  destinationPath: (doc: any) => string;
}

export class GlobFactory extends CollectionFactory {
  public constructor(private config: GlobConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher')
  }

  public async create(name: string, database: Database) {
    const {pattern, serializer, destinationPath} = this.config;
    const transforms = [serializer];

    return this.resolve((fsConfig: FileSystemConfig, watcher: chokidar.FSWatcher) => {
      if (fsConfig.watch) {
        watcher.add(pattern);
      }

      const input = (source: stream.Readable) => vinylReader({
        source, transforms, id: file => nodePath.basename(file.path).split('.')[0],
      });

      return buffer({
        bundle: false,
        io: {
          createReadable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return input(vinylFSWatcher({glob: pattern, watcher, events: ['add', 'change']}));
              case BufferStreamMode.Seed:
                return input(vfs.src(pattern) as stream.Transform)
              case BufferStreamMode.Delete:
                return input(vinylFSWatcher({glob: pattern, watcher, events: ['unlink']}));
            }
          },
          createWritable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return vinylWriter({
                  destination: vfs.dest('.') as stream.Transform,
                  transforms,
                  path: destinationPath,
                });
              case BufferStreamMode.Delete:
                return pipe(async doc => {
                  const filePath = destinationPath(doc);
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
 * A collection based on files on the filesystem based on glob pattern
 */
export const glob = (config: GlobConfig) => new GlobFactory(config);
