import {DirectoryConfig} from '../interfaces';
import {buffer} from './buffer';
import {vinyl, vinylFs} from '../pipes';
import * as fs from 'fs';
import * as nodePath from 'path';

export const directory = ({path, extension, serializer}: DirectoryConfig) =>
  buffer({
    stream: vinyl({
      adapter: vinylFs({
        src: `${path}/*.${extension}`,
        dest: path
      }),
      transforms: [serializer],
      id: async file => nodePath.basename(file.path).split('.')[0],
      path: async doc => `${doc._id}.${extension}`,
      onDelete: async doc => fs.unlinkSync(nodePath.join(path, doc._id)),
    }),
    bundle: false
  });
