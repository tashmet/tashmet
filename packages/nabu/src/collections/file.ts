import {FileConfig} from '../interfaces';
import {buffer} from './buffer';
import {DuplexTransformFactory, chainInput, chainOutput, dict} from '../pipes';
import * as fs from 'fs';

export const file = ({path, serializer, dictionary}: FileConfig) => {
  const transforms: DuplexTransformFactory[] = [serializer];
  if (dictionary) {
    transforms.push(dict());
  }

  return buffer({
    rwStream: {
      createReadable: () => fs.createReadStream(path, 'utf-8').pipe(chainInput(transforms)),
      createWritable: () => chainOutput(transforms).pipe(fs.createWriteStream(path, 'utf-8'))
    }
  });
}
