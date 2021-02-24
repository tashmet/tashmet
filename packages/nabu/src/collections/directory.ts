import {AsyncFactory} from '@ziqquratu/core';
import * as nodePath from 'path';
import {shards} from '../collections/shard';
import {GlobStreamFactory, GlobContentStreamFactory} from '../collections/glob';
import {File, FileAccess, FileContentConfig, PartialBy} from '../interfaces'

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

export interface DirectoryFilesConfig<T = any, TStored = T> extends
  PartialBy<DirectoryConfig, 'extension'>
{
  /**
   * Strategy for reading and writing content
   * 
   * When set to false, content will be an async generator that can be consumed
   * at a later point and when true the content will be read into a buffer.
   * 
   * If the content should be parsed a configuration for how to do that can be
   * given instead.
   */
  content?: FileContentConfig<T, TStored> | boolean;
}

export interface DirectoryContentConfig<T = any, TStored = T> extends
  DirectoryConfig,
  FileContentConfig<T, TStored>
{}

/**
 * A collection based on files in a directory on a file-system
 * 
 * @param config 
 */
export function directoryFiles<T = any, TStored = T>({path, extension, driver}: DirectoryFilesConfig<T, TStored>) {
  const resolveId = async (file: File) => nodePath.basename(file.path).split('.')[0]

  return shards<File<T>>({
    stream: new GlobStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      resolveId,
    })
  });
}

export function directoryContent<T = any, TStored = T>({path, extension, driver, serializer}: DirectoryContentConfig<T, TStored>) {
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const resolvePath = async (doc: any) => nodePath.join(path, fileName(doc));

  return shards<T>({
    stream: new GlobContentStreamFactory({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      serializer,
      resolvePath,
    }),
  });
}
