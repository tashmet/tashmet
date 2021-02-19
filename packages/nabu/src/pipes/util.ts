import {Cursor} from '@ziqquratu/database';
import {IOGate, Pipe} from '@ziqquratu/pipe';

export abstract class Transform<In = any, Out = In> {
  public abstract apply(gen: AsyncGenerator<In, any, In>): AsyncGenerator<Out, any, Out>;
}

class PipeableAsyncGenerator<T = unknown, TReturn = any, TNext = unknown> implements AsyncGenerator<T, TReturn, TNext> {
  public [Symbol.asyncIterator]: any;
  public next: (...args: [] | [TNext]) => Promise<IteratorResult<T, TReturn>>;
  public return: any;
  public throw: any;

  public constructor(gen: AsyncGenerator<T, TReturn, TNext>) {
    this.next = gen.next;
    this.return = gen.return;
    this.throw = gen.throw;
    this[Symbol.asyncIterator] = gen[Symbol.asyncIterator];
  }

  public pipe<Out>(t: Transform<T, Out> | Pipe<T, Out>): PipeableAsyncGenerator<Out> {
    if (!(t instanceof Transform)) {
      t = pipe(t);
    }
    return new PipeableAsyncGenerator<Out>(t.apply(this as any));
  }

  public sink<TSinkReturn>(writable: (gen: AsyncGenerator<T, TReturn, TNext>) => Promise<TSinkReturn>): Promise<TSinkReturn> {
    return writable(this);
  }
}

export function generator<T>(cursor: Cursor<T>) {
  async function *cursorGenerator() {
    while (await cursor.hasNext()) {
      const next = await cursor.next();
      if (next) {
        yield next;
      }
    }
  }
  return new PipeableAsyncGenerator<T, any, T>(cursorGenerator());
}

export class PipeTransform<In = any, Out = In> extends Transform<In, Out> {
  public constructor(private pipe: Pipe<In, Out>) { super(); }

  public apply(source: AsyncGenerator<In>) {
    const pipe = this.pipe;

    async function* gen() {
      for await (const data of source) {
        yield await pipe(data);
      }
    }
    return new PipeableAsyncGenerator(gen());
  }
}

export class FilterTransform<T> extends Transform<T> {
  public constructor(private test: Pipe<T, boolean>) { super(); }

  public apply(source: AsyncGenerator<T>) {
    const test = this.test;

    async function* gen() {
      for await (const data of source) {
        if (await test(data)) {
          yield data;
        }
      }
    }
    return gen();
  }
}

export class ArrayBundleTransform<T> extends Transform<T, T[]> {
  public apply(source: AsyncGenerator<T>) {
    async function* gen() {
      const list: T[] = []
      for await (const data of source) {
        list.push(data);
      }
      yield list;
    }
    return gen();
  }
}

export const processKey = (pipe: Pipe, key: string) => {
  return (async (data: any) => Object.assign(data, {[key]: await pipe(data[key])})) as Pipe
}

export function pipe<In = any, Out = any>(pipe: Pipe<In, Out>) { return new PipeTransform(pipe); }

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

export function filter<T>(test: Pipe<T, boolean>) { return new FilterTransform<T>(test); }
export function toArrayBundle<T>() { return new ArrayBundleTransform<T>(); }

export function pump<In = any, Out = In>(source: AsyncGenerator<In>, ...transforms: Transform[]) {
  let input = source;
  for (const t of transforms) {
    input = t.apply(input)
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
