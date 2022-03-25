import {Cursor} from '@tashmet/database';
import toArray from '@async-generators/to-array';
import {Pipe} from './interfaces';
import {ParallelTransform, Transform} from './transform';
import {pipe} from './pipes';

export class Pipeline<T = unknown, TReturn = any, TNext = unknown> implements AsyncGenerator<T, TReturn, TNext> {
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

  /**
   * Create a new pipeline that yields documents from a collection
   *
   * @param cursor A cursor, obtained by calling find() on a collection.
   */
  public static fromCursor<T>(cursor: Cursor<T>) {
    async function *cursorGenerator() {
      while (await cursor.hasNext()) {
        const next = await cursor.next();
        if (next) {
          yield next;
        }
      }
    }
    return new Pipeline<T, any, T>(cursorGenerator());
  }

  /**
   * Create a pipeline that yields a single chunk of data
   *
   * @param data
   */
  public static fromOne<T>(data: T) {
    async function* generateOne() {
      yield data;
    }
    return new Pipeline(generateOne());
  }

  /**
   * Create a pipeline that yields items from a list
   *
   * @param data
   */
  public static fromMany<T>(data: T[]) {
    async function* generateMany() {
      for (const item of data) {
        yield item;
      }
    }
    return new Pipeline(generateMany());
  }

  /**
   * Create a new pipeline by appending a transform or a pipe to this one.
   *
   * @param segment
   */
  public pipe<Out>(segment: Transform<T, Out> | Pipe<T, Out>): Pipeline<Out> {
    if (!(segment instanceof Transform)) {
      segment = pipe(segment);
    }
    return new Pipeline<Out>(segment.apply(this));
  }

  public parallel<Out>(segment: Pipe<T, Out>): Pipeline<Out> {
    return this.pipe(new ParallelTransform(segment));
  }

  /**
   * Direct the pipeline to a writable sink that consumes its data
   *
   * @param writable
   */
  public sink<TSinkReturn>(writable: (gen: AsyncGenerator<T, TReturn, TNext>) => Promise<TSinkReturn>): Promise<TSinkReturn> {
    return writable(this);
  }

  /**
   * Collect all data in the pipeline and return it as an array.
   */
  public toArray(): Promise<T[]> {
    return toArray(this);
  }
}
