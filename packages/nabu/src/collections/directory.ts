import {DuplexTransformFactory} from '../interfaces';
import {glob} from './glob';
import * as fs from 'fs-extra';
import * as nodePath from 'path';

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

/**
 * A collection based on files in a directory on the filesystem
 */
export const directory = ({path, extension, serializer, create}: DirectoryConfig) => {
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const pattern = `${path}/*.${extension}`;

  if (!fs.existsSync(path) && create) {
    fs.mkdirpSync(path);
  }

  return glob({ pattern, serializer, destinationPath: doc => nodePath.join(path, fileName(doc))})
}
