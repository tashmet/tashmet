import {fsGlob} from './glob';
import * as fs from 'fs-extra';
import * as nodePath from 'path';

export interface DirectoryConfig {
  /**
   * Path to directory.
   */
  path: string;

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
export const fsDirectory = ({path, extension, create}: DirectoryConfig) => {
  const fileName = (doc: any) => `${doc._id}.${extension}`;
  const pattern = `${path}/*.${extension}`;

  if (!fs.existsSync(path) && create) {
    fs.mkdirpSync(path);
  }

  return fsGlob({ pattern, destinationPath: doc => nodePath.join(path, fileName(doc))})
}
