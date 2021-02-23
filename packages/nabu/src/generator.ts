import {AsyncFactory} from '@ziqquratu/core';
import {Cursor} from '@ziqquratu/database';
import {Pipe} from '@ziqquratu/pipe';
import toArray from '@async-generators/to-array';
import {File, FileAccess} from './interfaces';
import {Transform} from './transform';
import {pipe} from './pipes';

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

  public static fromPath(
    path: string | string[], protocol: AsyncFactory<FileAccess>
  ): Generator<File<AsyncGenerator<Buffer> | undefined>> {
    async function* gen() {
      const fa = await protocol.create();
      for await (const file of fa.read(path)) {
        yield file;
      }
    }
    return new Generator(gen());
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

  public pipe<Out>(t: Transform<T, Out> | Pipe<T, Out>): Generator<Out> {
    if (!(t instanceof Transform)) {
      t = pipe(t);
    }
    return new Generator<Out>(t.apply(this as any));
  }

  public sink<TSinkReturn>(writable: (gen: AsyncGenerator<T, TReturn, TNext>) => Promise<TSinkReturn>): Promise<TSinkReturn> {
    return writable(this);
  }

  public toArray(): Promise<T[]> {
    return toArray(this);
  }
}
