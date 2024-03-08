import { Document } from '@tashmet/tashmet';
import { makeArrayInFileIO } from './arrayInFile.js';
import { makeObjectInFileIO } from './objectInFile.js';
import { BufferIO, StreamIO } from '../interfaces.js';
import { DirectoryIO } from './directory.js';
import { GlobIO } from './glob.js';

export function makeIO(store: Document): StreamIO | BufferIO {
  const name = Object.keys(store)[0];
  const config = store[name];

  switch (name) {
    case 'directory':
      return DirectoryIO.fromConfig(config);
    case 'glob':
      return GlobIO.fromConfig(config);
    case 'arrayInFile':
      return makeArrayInFileIO(config);
    case 'objectInFile':
      return makeObjectInFileIO(config);
    default:
      throw new Error('Unsupported IO: ' + name);
  }
}

class Fill {
  
}