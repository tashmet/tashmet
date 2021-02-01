import {FileConfig} from '../interfaces';
import {buffer} from './buffer';
import {DuplexTransformFactory, chainInput, chainOutput, dict} from '../pipes';
import * as fs from 'fs';
import * as stream from 'stream';

const pumpify = require('pumpify');

export const file = ({path, serializer, dictionary}: FileConfig) => {
  const transforms: DuplexTransformFactory[] = [serializer];
  if (dictionary) {
    transforms.push(dict());
  }

  return buffer({
    rwStream: {
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
