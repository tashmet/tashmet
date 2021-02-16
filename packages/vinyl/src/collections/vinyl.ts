import Vinyl from 'vinyl';
import {FileSystemConfig} from '../interfaces';
import {vinylReader, vinylWriter} from '../util';
import {pick} from 'lodash';
import {VinylFS} from '../fs';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import {pump, ShardStreamConfig, ShardStreamFactory} from '@ziqquratu/nabu';

export interface VinylFSConfig {
  /**
   * Glob pattern
   */
  source: string | string[];

  destination?: string;

  /** A function returning the file path given a document on write */
  path: (doc: any) => string;
  
  /** A function to determine the ID of a document read */
  id?: (file: Vinyl) => string; 

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

export class VinylFSStreamFactory extends ShardStreamFactory {
  public constructor(private config: VinylFSConfig) {
    super('vinyl.FileSystemConfig', VinylFS)
  }

  public async create(transforms: IOGate<Pipe>[]): Promise<ShardStreamConfig> {
    const {source, destination, id, path} = this.config;

    return this.resolve(async (fsConfig: FileSystemConfig, vfs: VinylFS) => {
      const vfsSrcOpts = pick(this.config, 'buffer', 'read');

      const input = (gen: AsyncGenerator) => transforms.length > 0
        ? pump(gen, ...vinylReader({transforms, id}))
        : gen;
      const output = (gen: AsyncGenerator): AsyncGenerator<any> => transforms.length > 0
        ? pump(gen, ...vinylWriter({transforms, path}))
        : gen;

      const watch = (...events: string[]) => vfs.watch(source, events, vfsSrcOpts);

      return {
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
      };
    })
  }
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const vinylFS = (config: VinylFSConfig) => new VinylFSStreamFactory(config);
