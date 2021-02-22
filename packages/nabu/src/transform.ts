import {Pipe} from '@ziqquratu/pipe';

export abstract class Transform<In = any, Out = In> {
  public abstract apply(gen: AsyncGenerator<In>): AsyncGenerator<Out>;
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
