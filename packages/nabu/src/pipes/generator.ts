import {Cursor} from '@ziqquratu/database';
import {Pipe} from '@ziqquratu/pipe';
import {Transform, pipe} from './transform';

export class Generator<T = unknown, TReturn = any, TNext = unknown> implements AsyncGenerator<T, TReturn, TNext> {
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

  public static fromCursor<T>(cursor: Cursor<T>) {
    async function *cursorGenerator() {
      while (await cursor.hasNext()) {
        const next = await cursor.next();
        if (next) {
          yield next;
        }
      }
    }
    return new Generator<T, any, T>(cursorGenerator());
  }

  public static fromOne<T>(data: T) {
    async function* generateOne() {
      yield data;
    }
    return new Generator(generateOne());
  }

  public static fromMany<T>(data: T[]) {
    async function* generateMany() {
      for (const item of data) {
        yield item;
      }
    }
    return new Generator(generateMany());
  }

  public static pump<In = any, Out = In>(source: AsyncGenerator<In>, ...transforms: Transform[]) {
    let input = source;
    for (const t of transforms) {
      input = t.apply(input)
    }
    return new Generator(input as AsyncGenerator<Out>);
  }

  public pipe<Out>(t: Transform<T, Out> | Pipe<T, Out>): Generator<Out> {
    if (!(t instanceof Transform)) {
      t = pipe(t);
    }
    return new Generator<Out>(t.apply(this as any));
  }

  public sink<TSinkReturn>(writable: (gen: AsyncGenerator<T, TReturn, TNext>) => Promise<TSinkReturn>): Promise<TSinkReturn> {
    return writable(this);
  }
}
