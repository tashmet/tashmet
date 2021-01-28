import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {IOGate, Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');
const duplexer = require('duplexer2');

export * from './dict';
export * from './json';
export * from './yaml';

export const transformPipeline = (src: stream.Duplex, transforms: IOGate[]): stream.Duplex => {
  const readable = pumpify.obj(src, ...transforms.map(t => {
    const p = t.input as Pipe;
    return pipe(data => p(data));
  }));
  const writable = pumpify.obj(...transforms.map(t => {
    const p = t.output as Pipe;
    return pipe(data => p(data));
  }).reverse(), src);
  return duplexer({objectMode: true}, writable, readable);
}