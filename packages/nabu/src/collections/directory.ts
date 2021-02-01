import {DirectoryConfig} from '../interfaces';
import {buffer} from './buffer';
import {StreamFactory, vinyl, vinylFs} from '../pipes';
import * as fs from 'fs';
import * as nodePath from 'path';
import * as stream from 'stream';
import pipe from 'pipeline-pipe';

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
