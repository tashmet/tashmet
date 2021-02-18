import {IOGate, Pipe} from '@ziqquratu/pipe';

export type Transform<In = any, Out = In> = (source: AsyncGenerator<In>) => AsyncGenerator<Out>;

export const processKey = (pipe: Pipe, key: string) => {
  return (async (data: any) => Object.assign(data, {[key]: await pipe(data[key])})) as Pipe
}

export function pipe<In = any, Out = any>(pipe: Pipe<In, Out>): Transform<In, Out> {
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

export function filter<T>(test: Pipe<T, boolean>): Transform<T, T> {
  async function* gen(source: AsyncGenerator<T>) {
    for await (const data of source) {
      if (await test(data)) {
        yield data;
      }
    }
  }
  return source => gen(source);
}

export function pump<In = any, Out = In>(source: AsyncGenerator<In>, ...transforms: Transform[]) {
  let input = source;
  for (const t of transforms) {
    input = t(input)
  }
  return input as AsyncGenerator<Out>;
}

export async function* generateOne(data: any) {
  yield data;
}

export async function* generateMany(data: any[]) {
  for (const item of data) {
    yield item;
  }
}
