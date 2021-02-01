import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');

export interface StreamFactory {
  createReadable(...args: any[]): stream.Readable;

  createWritable(...args: any[]): stream.Writable;
}

export interface DuplexTransformFactory {
  createInput(key?: string): stream.Transform;

  createOutput(key?: string): stream.Transform;
}

export const duplexPipeTransform = (input: Pipe, output: Pipe) => ({
  createInput: (key?: string) => pipe(async data => key
    ? Object.assign(data, {[key]: await input(data[key])})
    : await input(data)
  ),
  createOutput: (key?: string) => pipe(async data => key
    ? Object.assign(data, {[key]: await output(data[key])})
    : await output(data)
  ),
}) as DuplexTransformFactory;

export const chainInput = (transforms: DuplexTransformFactory[], key?: string) => transforms.length > 1
  ? pumpify.obj(...transforms.map(t => t.createInput(key))) as stream.Transform
  : transforms[0].createInput(key);

export const chainOutput = (transforms: DuplexTransformFactory[], key?: string) => transforms.length > 1
  ? pumpify.obj(...transforms.map(t => t.createOutput(key)).reverse()) as stream.Transform
  : transforms[0].createOutput(key);
