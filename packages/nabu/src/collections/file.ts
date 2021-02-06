import {DuplexTransformFactory} from '../interfaces';
import {buffer} from './buffer';
import {chainInput, chainOutput, dict} from '../pipes';
import * as fs from 'fs';
import * as stream from 'stream';

const pumpify = require('pumpify');

export interface FileConfig {
  /**
   * Path to file.
   */
  path: string;

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  /**
   * Store the collection as a dictionary instead of a list
   * 
   * If set the collection will be stored as a dictionary on disk with keys
   * being the IDs of each document.
   */
  dictionary: boolean;
}

/**
 * A collection based on a single file on the filesystem
 */
export const file = ({path, serializer, dictionary}: FileConfig) => {
  const transforms: DuplexTransformFactory[] = [serializer];
  if (dictionary) {
    transforms.push(dict());
  }

  return buffer({
    io: {
      createReadable: () => {
        if (fs.existsSync(path)) {
          return pumpify.obj(
            fs.createReadStream(path, 'utf-8'),
            chainInput(transforms)
          );
        }
        return stream.Readable.from([])
      },
      createWritable: () => {
        return pumpify.obj(
          chainOutput(transforms),
          fs.createWriteStream(path, 'utf-8')
        );
      }
    }
  });
}
