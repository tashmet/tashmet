import {FileSystemConfig} from '../interfaces';
import {buffer, BufferStreamMode} from './buffer';
import {vinylFSWatcher, vinylReader, VinylTransformer, vinylWriter} from '../pipes';
import * as fs from 'fs-extra';
import * as vfs from 'vinyl-fs';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import Vinyl from 'vinyl';
import pipe from 'pipeline-pipe';
import {pick} from 'lodash';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';

const pumpify = require('pumpify');

export interface VinylFSConfig {
  /**
   * Glob pattern
   */
  source: string | string[];

  destination?: string;

  transformer?: VinylTransformer;

  /**
   * Whether or not you want to buffer the file contents into memory.
   * Setting to false will make file.contents a paused Stream.
   * 
   * @default true
   */
  buffer?: boolean;

  /**
   * Whether or not you want the file to be read at all.
   * Useful for stuff like removing files. Setting to false will make file.contents = null
   * 
   * @default true
   */
  read?: boolean;
}

export class VinylFSFactory extends CollectionFactory {
  public constructor(private config: VinylFSConfig) {
    super('nabu.FileSystemConfig', 'chokidar.FSWatcher')
  }

  public async create(name: string, database: Database) {
    const {source, destination, transformer} = this.config;

    return this.resolve((fsConfig: FileSystemConfig, watcher: chokidar.FSWatcher) => {
      if (fsConfig.watch) {
        watcher.add(source);
      }

      const vinylSrcOpts: vfs.SrcOptions = pick(this.config, 'buffer', 'read');

      const input = (readable: stream.Readable) => transformer
        ? pumpify.obj(readable, vinylReader(transformer))
        : readable;
      const output = (writable: stream.Readable) => transformer
        ? pumpify.obj(vinylWriter(transformer), writable) : writable;

      const watch = (...events: string[]) => vinylFSWatcher(Object.assign({glob: source, watcher, events}, vinylSrcOpts));

      return buffer({
        bundle: false,
        io: {
          createReadable(mode: BufferStreamMode) {
            switch (mode) {
              case BufferStreamMode.Update:
                return input(watch('add', 'change'));
              case BufferStreamMode.Seed:
                return input(vfs.src(source, vinylSrcOpts) as stream.Transform);
              case BufferStreamMode.Delete:
                return input(watch('unlink'));
            }
          },
          createWritable(mode: BufferStreamMode) {
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
          }
        },
      }).create(name, database);
    })
  }
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const vinylFS = (config: VinylFSConfig) => new VinylFSFactory(config);
