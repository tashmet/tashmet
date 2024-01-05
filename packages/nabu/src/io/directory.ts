import { Document } from '@tashmet/tashmet';
import { makeFileFormat } from '../format/index.js';
import { FileStreamIO } from './fileStream.js';

export class DirectoryIO extends FileStreamIO {
  static fromConfig({path, extension, format, ...options}: Document) {
    if (typeof path !== 'string') {
      throw new Error('Failed create directory IO, path is not a string');
    }

    const merge = Object.assign(
      {}, options?.merge, { _id: { $basename: ['$path', { $extname: '$path' }] } }
    );

    return new DirectoryIO(
      id => id ? `${path}/${id}${extension}` : `${path}/*${extension}`,
      makeFileFormat(format),
      merge,
      options?.construct
    );
  }
}
