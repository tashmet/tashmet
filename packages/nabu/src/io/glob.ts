import { Document } from '@tashmet/tashmet';
import { makeFileFormat } from '../format/index.js';
import { FileStreamIO } from './fileStream.js';
import { Validator } from '@tashmet/engine';

export class GlobIO extends FileStreamIO {
  static fromConfig({pattern, format, ...options}: Document, validator?: Validator) {
    if (typeof pattern !== 'string') {
      throw new Error('Failed create glob IO, pattern is not a string');
    }

    const merge = Object.assign(
      {}, options?.mergeStat, { _id: '$path' }
    );

    return new FileStreamIO(
      id => id ? id : pattern,
      makeFileFormat(format),
      merge,
      options?.construct,
      options?.default,
      validator,
    );
  }
}
