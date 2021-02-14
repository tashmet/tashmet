import {DirectoryConfig} from '../interfaces';
import {glob} from './glob';
import * as fs from 'fs-extra';
import * as nodePath from 'path';

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
