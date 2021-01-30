import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {IOGate, Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');

export const readablePipeline = (src: stream.Readable, transforms: IOGate[] = []): stream.Readable => {
  return pumpify.obj(src, ...transforms.map(t => {
    const p = t.input as Pipe;
    return pipe(data => p(data));
  }));
}

export const writablePipeline = (dest: stream.Writable, transforms: IOGate[] = []): stream.Writable => {
  return pumpify.obj(...transforms.map(t => {
    const p = t.output as Pipe;
    return pipe(data => p(data));
  }).reverse(), dest);
}

export interface StreamFactory {
  createReadable(): stream.Readable;

  createWritable(): stream.Writable;
}
