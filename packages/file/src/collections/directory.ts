import * as nodePath from 'path';
import {shards} from './shard';
import {globFilesStream, globContentStream} from './glob';
import {
  ExtractedFileContentConfig,
  File,
  FileContentConfig,
  FileStreamConfig,
  MultiFilesWithContentConfig,
  PartialBy,
  Pipe,
} from '../interfaces'

export interface DirectoryConfig<T> extends FileStreamConfig<T> {
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
}

export type DirectoryFilesConfig<T = any, TStored = T> =
  PartialBy<DirectoryConfig<T>, 'extension'> & MultiFilesWithContentConfig<T, TStored>;

export type DirectoryContentConfig<T = any, TStored = T> =
  DirectoryConfig<T> & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;


/**
 * A collection based on files in a directory on a file-system
 *
 * @param config
 */
export function directoryFiles<T = any, TStored = T>({path, extension, driver}: DirectoryFilesConfig<T, TStored>) {
  return shards<File<T>>({
    stream: globFilesStream({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
    })
  });
}

export function directoryContent<T = any, TStored = T>(
  {path, extension, driver, serializer, resolveId, resolvePath}: DirectoryContentConfig<T, TStored>)
{
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const defaultPathResolver = async (doc: any) => nodePath.join(path, fileName(doc));
  const defaultIdResolver: Pipe<File, string> = async file =>
    nodePath.basename(file.path).split('.')[0]

  return shards<T>({
    stream: globContentStream({
      driver,
      pattern: extension ? `${path}/*.${extension}` : `${path}/*`,
      serializer,
      resolveId: resolveId || defaultIdResolver,
      resolvePath: resolvePath || defaultPathResolver,
    }),
  });
}
