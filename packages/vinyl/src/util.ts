import * as stream from 'stream';
import Vinyl from 'vinyl';
import {omit} from 'lodash';
import {transformInput, transformOutput, pipe, Transform} from '@ziqquratu/nabu';
import {IOGate, Pipe} from '@ziqquratu/pipe';

async function signalEnd(reader: stream.Readable) {
  return new Promise(resolve => {
    reader.once("end", resolve);
  });
}

async function signalReadable(reader: stream.Readable) {
  return new Promise(resolve => {
    reader.once("readable", resolve);
  });
}

export function makeGenerator<T>(
  readable: stream.Readable,
): AsyncGenerator<T, void, unknown> {

  return (async function* genFn() {
    await signalReadable(readable);
    const endPromise = signalEnd(readable);

    while (readable.readable) {
      let chunk;
      while (null !== (chunk = readable.read())) { 
        yield chunk;
      } 
      await Promise.race([endPromise, signalReadable(readable)]);
    }
  })();
}

export function makeStream<T>(generator: AsyncGenerator): stream.Readable {
  return stream.Readable.from(generator);
}

export function writeToStream(src: AsyncGenerator, dest: stream.Writable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    makeStream(src).pipe(dest)
      .on('finish', resolve)
      .on('error', reject);
  });
}

export interface VinylReaderConfig {
  /** Transforms for modifying file contents */
  transforms: IOGate<Pipe>[];

  /** A function to determine the ID of a document read */
  id?: (file: Vinyl) => string; 
}

export const vinylReader = ({transforms, id}: VinylReaderConfig) => [
  pipe(async (file: Vinyl) => ({file, contents: file.contents})),
  transformInput(transforms, 'contents'),
  pipe(async ({file, contents}) => id ? Object.assign(contents, {_id: id(file)}) : contents),
];

export const vinylContents: Transform = pipe<Vinyl>(async file => file.contents);

export interface VinylWriterConfig {
  /** Transforms for modifying file contents */
  transforms: IOGate<Pipe>[];

  /** A function returning the file path given a document on write */
  path: (doc: any) => string;
}

export const vinylWriter = ({transforms, path}: VinylWriterConfig) => [
  pipe(async doc => ({doc, contents: omit(doc, ['_id'])})),
  transformOutput(transforms, 'contents'),
  pipe(async ({doc, contents}) => new Vinyl({path: path(doc), contents})),
];