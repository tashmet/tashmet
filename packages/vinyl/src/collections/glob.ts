import {vinylFS} from './vinyl';
import * as nodePath from 'path';

export interface GlobConfig {
  /**
   * Glob pattern
   */
  pattern: string | string[];

  /**
   * A function that should return a path where to write a document
   */
  destinationPath: (doc: any) => string;
}

/**
 * A collection based on files on the filesystem based on glob pattern
 */
export const fsGlob = ({pattern, destinationPath}: GlobConfig) => vinylFS({
  source: pattern,
  id: file => nodePath.basename(file.path).split('.')[0],
  path: destinationPath,
});
