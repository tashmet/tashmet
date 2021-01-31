import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');
const ternaryStream = require('ternary-stream');

export interface StreamFactory {
  createReadable(...args: any[]): stream.Readable;

  createWritable(...args: any[]): stream.Writable;
}

export interface DocumentStreamConfig {
  readable: () => stream.Readable;
  writable: () => stream.Writable;
  onDelete: () => stream.Writable;
}

export const documentStream = ({readable, writable, onDelete}: DocumentStreamConfig) => ({
  createReadable: readable,
  createWritable: () =>  ternaryStream((doc: any) => !doc._delete, writable, onDelete),
}) as StreamFactory;

export class ObjectPipeTransformFactory implements StreamFactory {
  public static inputPipeline(pipeFactories: ObjectPipeTransformFactory[], key?: string): stream.Transform {
    return pipeFactories.length > 1
      ? pumpify.obj(...pipeFactories.map(pf => pf.createReadable(key)))
      : pipeFactories[0].createReadable(key);
  }

  public static outputPipeline(pipeFactories: ObjectPipeTransformFactory[], key?: string): stream.Transform {
    return pipeFactories.length > 1
      ? pumpify.obj(...pipeFactories.map(pf => pf.createWritable(key)).reverse())
      : pipeFactories[0].createWritable(key);
  }

  public constructor(
    private input: Pipe,
    private output: Pipe,
  ) {}

  public createReadable(key?: string): stream.Readable {
    return pipe(async data => {
      if (key) {
        return Object.assign(data, {[key]: await this.input(data[key])});
      }
      return await this.input(data);
    });
  }

  public createWritable(key?: string): stream.Writable {
    return pipe(async data => {
      if (key) {
        return Object.assign(data, {[key]: await this.output(data[key])});
      }
      return await this.output(data);
    });
  }
}
