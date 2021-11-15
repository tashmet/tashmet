import {Pipe} from './interfaces';

export abstract class Transform<In = any, Out = In> {
  public abstract apply(gen: AsyncGenerator<In>): AsyncGenerator<Out>;
}

export class CompositeTransform<In, Out> extends Transform<In, Out> {
  public constructor(
    private current: Transform,
    private prev: Transform | undefined = undefined,
  ) { super(); }

  public apply(gen: AsyncGenerator<In>): AsyncGenerator<Out> {
    const prev = this.prev ? this.prev.apply(gen) : gen;
    return this.current.apply(prev);
  }

  public pipe<T>(pipe: Transform<Out, T>): CompositeTransform<Out, T> {
    return new CompositeTransform(pipe, this.current);
  }
}

export function compose<In, Out>(transform: Transform<In, Out>): CompositeTransform<In, Out> {
  return new CompositeTransform(transform);
}


export class PipeTransform<In = any, Out = In> extends Transform<In, Out> {
  public constructor(private fn: Pipe<In, Out>) { super(); }

  public apply(source: AsyncGenerator<In>) {
    const pipe = this.fn;

    async function* gen() {
      for await (const data of source) {
        yield await pipe(data);
      }
    }
    return gen();
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

export class Reducer<In, Out> extends Transform<In, Out> {
  public constructor(
    private reduce: (acc: Out, value: In) => Out,
    private initial: Out,
  ) { super(); }

  public apply(source: AsyncGenerator<In>) {
    const { initial, reduce } = this;

    async function* gen() {
      let acc: Out = initial;
      for await (const data of source) {
        acc = reduce(acc, data);
      }
      yield acc;
    }
    return gen();
  }
}

export class Disperser<T> extends Transform<T[], T> {
  public apply(source: AsyncGenerator<T[]>) {
    async function* gen() {
      for await (const data of source) {
        for (const chunk of data) {
          yield chunk;
        }
      }
    }
    return gen();
  }
}

export class ParallelTransform<In, Out> extends Transform<In, Out> {
  public constructor(private pipe: Pipe<In, Out>) { super(); }

  public apply(source: AsyncGenerator<In>) {
    const pipe = this.pipe;

    async function* gen() {
      const promises: Promise<any>[] = [];

      for await (const chunk of source) {
        promises.push(pipe(chunk));
      }
      for (const chunk of await Promise.all(promises)) {
        yield chunk;
      }
    }
    return gen();
  }
}
