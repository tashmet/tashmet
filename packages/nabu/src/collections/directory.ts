import {AsyncFactory} from '@ziqquratu/core';
import {Pipe} from '@ziqquratu/pipe';
import * as nodePath from 'path';
import {shards} from '../collections/shard';
import {GlobStreamFactory, GlobContentStreamFactory} from '../collections/glob';
import {ExtractedFileContentConfig, File, FileAccess, FileContentConfig, MultiFilesWithContentConfig, PartialBy} from '../interfaces'

export interface DirectoryConfig {
  /**
   * Path to the directory to where the files reside
   */
  path: string;

  /**
   * Extension of the files.
   * 
   * Should be provided without a dot, ie 'json' or 'yaml' etc. This both serves
   * as a filter for incoming files, as well as a basis for determining the 
   * name of outgoing files if the content is extracted.
   */
  extension: string;

  /**
   * The underlying file system driver to use.
   */
  driver: AsyncFactory<FileAccess>;
}

export type DirectoryFilesConfig<T = any, TStored = T> =
  PartialBy<DirectoryConfig, 'extension'> & MultiFilesWithContentConfig<T, TStored>;

export type DirectoryContentConfig<T = any, TStored = T> =
  DirectoryConfig & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;

export const directoryIdResolver: Pipe<File, string> = async file =>
  nodePath.basename(file.path).split('.')[0]

/**
 * A collection based on files in a directory on a file-system
 * 
 * @param config 
 */
export function directoryFiles<T = any, TStored = T>({path, extension, driver}: DirectoryFilesConfig<T, TStored>) {
  return shards<File<T>>({
    stream: new GlobStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      resolveId: directoryIdResolver,
    })
  });
}

export function directoryContent<T = any, TStored = T>(
  {path, extension, driver, serializer, resolvePath}: DirectoryContentConfig<T, TStored>)
{
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const defaultPathResolver = async (doc: any) => nodePath.join(path, fileName(doc));

  return shards<T>({
    stream: new GlobContentStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      serializer,
      resolveId: directoryIdResolver,
      resolvePath: resolvePath || defaultPathResolver,
    }),
  });
}
