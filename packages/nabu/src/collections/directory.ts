import {StreamFactory, DuplexTransformFactory} from '../interfaces';
import {buffer} from './buffer';
import {vinyl, vinylFs} from '../pipes';
import * as fs from 'fs';
import * as nodePath from 'path';
import * as stream from 'stream';
import pipe from 'pipeline-pipe';

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
export const directory = ({path, extension, serializer}: DirectoryConfig) => {
  const fileName = (doc: any) => `${doc._id}.${extension}`;

  return buffer({
    rwStream: vinyl({
      adapter: vinylFs({
        src: `${path}/*.${extension}`,
        dest: path
      }),
      transforms: [serializer],
      id: file => nodePath.basename(file.path).split('.')[0],
      path: fileName,
    }),
    dlStream: ({
      createReadable: () => new stream.Readable(),
      createWritable: () => pipe(async doc => {
        const filePath = nodePath.join(path, fileName(doc));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      })
    }) as StreamFactory,
  });
}
