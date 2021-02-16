import {IOGate, Pipe} from '@ziqquratu/pipe';
import * as stream from 'stream';

export type Transform<T = any> = (source: AsyncGenerator) => AsyncGenerator<T>;

export const processKey = (pipe: Pipe, key: string) => {
  return (async (data: any) => Object.assign(data, {[key]: await pipe(data[key])})) as Pipe
}

export function pipe<In = any, Out = any>(pipe: Pipe<In, Out>): Transform {
  async function* gen(source: AsyncGenerator<any>) {
    for await (const data of source) {
      yield await pipe(data);
    }
  }
  return source => gen(source);
}

export const chain = (pipes: Pipe[]): Pipe => async (data: any) => {
  let res = data;
  for (const pipe of pipes) {
    res = await pipe(res);
  }
  return res;
};

export const transformInput = (transforms: IOGate<Pipe>[], key?: string): Transform => {
  const p = chain(transforms.map(t => t.input));
  return pipe(key ? processKey(p, key) : p);
}

export const transformOutput = (transforms: IOGate<Pipe>[], key?: string): Transform => {
  const p = chain(transforms.map(t => t.output).reverse());
  return pipe(key ? processKey(p, key) : p);
}

export const filter = (test: Pipe<any, boolean>): Transform => {
  async function* gen(source: AsyncGenerator) {
    for await (const data of source) {
      if (await test(data)) {
        yield data;
      }
    }
  }
  return source => gen(source);
}

export const pump = (source: AsyncGenerator, ...transforms: Transform[]) => {
  let input = source;
  for (const t of transforms) {
    input = t(input)
  }
  return input;
}

export async function* generateOne(data: any) {
  yield data;
}

export async function* generateMany(data: any[]) {
  for (const item of data) {
    yield item;
  }
}

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
