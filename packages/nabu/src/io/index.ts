import { Document } from '@tashmet/tashmet';
import { makeArrayInFileIO } from './arrayInFile.js';
import { makeObjectInFileIO } from './objectInFile.js';
import { makeDirectoryIO } from './directory.js';
import { makeGlobIO } from './glob.js';
import { IOSegment } from '../interfaces.js';

export function makeIO(store: Document): IOSegment {
  const name = Object.keys(store)[0];
  const config = store[name];

  switch (name) {
    case 'directory':
      return makeDirectoryIO(config);
    case 'glob':
      return makeGlobIO(config);
    case 'arrayInFile':
      return makeArrayInFileIO(config);
    case 'objectInFile':
      return makeObjectInFileIO(config);
    default:
      throw new Error('Unsupported IO: ' + name);
  }
}
