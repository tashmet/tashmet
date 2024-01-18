import { Document } from '@tashmet/tashmet';
import { ArrayInFileIO } from '../io/arrayInFile.js';
import { BufferIO, StreamIO } from '../interfaces.js';
import { ObjectInFileIO } from './objectInFile.js';
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
      return ArrayInFileIO.fromConfig(config);
    case 'objectInFile':
      return ObjectInFileIO.fromConfig(config);
    default:
      throw new Error('Unsupported IO: ' + name);
  }
}
