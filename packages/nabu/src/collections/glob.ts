import {vinylFS} from './vinyl';
import * as nodePath from 'path';
import { IOGate, Pipe } from '@ziqquratu/pipe';

export interface GlobConfig {
  /**
   * Glob pattern
   */
  pattern: string | string[];

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: IOGate<Pipe>;

  /**
   * A function that should return a path where to write a document
   */
  destinationPath: (doc: any) => string;
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const glob = ({pattern, serializer, destinationPath}: GlobConfig) => vinylFS({
  source: pattern,
  transformer: {
    transforms: [serializer],
    id: file => nodePath.basename(file.path).split('.')[0],
    path: destinationPath,
  }
});
