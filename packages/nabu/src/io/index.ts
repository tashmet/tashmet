import { Document } from '@tashmet/tashmet';
import { FileStreamIO } from '../io/fileStream.js';
import { ArrayInFileIO } from '../io/arrayInFile.js';
import { BufferIO, StreamIO } from '../interfaces.js';
import { ObjectInFileIO } from './objectInFile.js';

export function makeIO(store: Document): StreamIO | BufferIO {
  const name = Object.keys(store)[0];
  const config = store[name];

  switch (name) {
    case 'directory':
      return FileStreamIO.fromDirectory(config);
    case 'glob':
      return FileStreamIO.fromGlob(config);
    case 'arrayInFile':
      return ArrayInFileIO.fromConfig(config);
    case 'objectInFile':
      return ObjectInFileIO.fromConfig(config);
    default:
      throw new Error('Unsupported IO: ' + name);
  }
}
