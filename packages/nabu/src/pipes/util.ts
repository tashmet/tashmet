import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {Pipe} from '@ziqquratu/pipe';
import {DuplexTransformFactory} from '../interfaces';

const pumpify = require('pumpify');

/** Create a duplex transform factory from two pipes */
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

export const processKey = (pipe: Pipe, key: string) => {
  return (async (data: any) => Object.assign(data, {[key]: await pipe(data[key])})) as Pipe
}

export const chain = (pipes: Pipe[]): Pipe => async (data: any) => {
  let res = data;
  for (const pipe of pipes) {
    res = await pipe(res);
  }
  return res;
}

export const pipeline = (generator: AsyncGenerator, pipe: Pipe | Pipe[]) => {
  const p = Array.isArray(pipe) ? chain(pipe) : pipe;

  async function* pipelineGenerator() {
    for await (const chunk of generator) {
      yield await p(chunk);
    }
  }
  return pipelineGenerator();
}

/** Create an input transform stream from a list of duplex transforms */
export const chainInput = (transforms: DuplexTransformFactory[], key?: string) => transforms.length > 1
  ? pumpify.obj(...transforms.map(t => t.createInput(key))) as stream.Transform
  : transforms[0].createInput(key);

/** Create an output transform stream from a list of duplex transforms */
export const chainOutput = (transforms: DuplexTransformFactory[], key?: string) => transforms.length > 1
  ? pumpify.obj(...transforms.map(t => t.createOutput(key)).reverse()) as stream.Transform
  : transforms[0].createOutput(key);
