import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import * as fs from 'fs';

const pumpify = require('pumpify');

export * from './dict';
export * from './json';
export * from './yaml';

export const readablePipeline = (src: stream.Readable, transforms: IOGate[]): stream.Readable => {
  return pumpify.obj(src, ...transforms.map(t => {
    const p = t.input as Pipe;
    return pipe(data => p(data));
  }));
}

export const writablePipeline = (dest: stream.Writable, transforms: IOGate[]): stream.Writable => {
  return pumpify.obj(...transforms.map(t => {
    const p = t.output as Pipe;
    return pipe(data => p(data));
  }).reverse(), dest);
}

export interface StreamFactory {
  createReadable(): stream.Readable;

  createWritable(): stream.Writable;
}

export class FileStreamFactory implements StreamFactory {
  public constructor(private path: string, private transforms: IOGate[]) {}

  public createReadable() {
    return readablePipeline(fs.createReadStream(this.path, {encoding: 'utf-8'}), this.transforms);
  }

  public createWritable() {
    return writablePipeline(fs.createWriteStream(this.path, {encoding: 'utf-8'}), this.transforms);
  }
}
