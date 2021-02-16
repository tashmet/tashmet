import {FileSystemConfig} from '../interfaces';
import {shardedBuffer} from './buffer';
import {pump, vinylReader, VinylTransformer, vinylWriter} from '../pipes';
import {pick} from 'lodash';
import {CollectionFactory, Database} from '@ziqquratu/ziqquratu';
import { VinylFS } from '../vinyl/fs';

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
    super('nabu.FileSystemConfig', VinylFS)
  }

  public async create(name: string, database: Database) {
    const {source, destination, transformer} = this.config;

    return this.resolve((fsConfig: FileSystemConfig, vfs: VinylFS) => {
      const vfsSrcOpts = pick(this.config, 'buffer', 'read');

      const input = (gen: AsyncGenerator) => transformer
        ? pump(gen, ...vinylReader(transformer))
        : gen;
      const output = (gen: AsyncGenerator): AsyncGenerator<any> => transformer
        ? pump(gen, ...vinylWriter(transformer))
        : gen;

      const watch = (...events: string[]) => vfs.watch(source, events, vfsSrcOpts);

      return shardedBuffer({
        seed: input(vfs.src(source, vfsSrcOpts)),
        input: fsConfig.watch ? input(watch('add', 'change')) : undefined,
        inputDelete: fsConfig.watch ? input(watch('unlink')) : undefined,
        output: (source, deletion) => {
          const files = output(source);
          if (deletion) {
            return vfs.remove(files);
          }
          return vfs.write(files, destination || '.');
        }
      }).create(name, database);
    })
  }
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const vinylFS = (config: VinylFSConfig) => new VinylFSFactory(config);
