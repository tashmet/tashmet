import {AsyncFactory} from '@ziqquratu/core';
import {Cursor} from '@ziqquratu/database';
import {IOGate, Pipe} from '@ziqquratu/pipe';
import {File, FileAccess} from '../interfaces';
import {toBufferedFile, toFile, toFileSystem} from './file';
import {Transform, pipe, FilterTransform, transformInput, transformOutput} from './transform';

export class BaseGenerator<T = unknown, TReturn = any, TNext = unknown> implements AsyncGenerator<T, TReturn, TNext> {
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

  public pipe<Out>(t: Transform<T, Out> | Pipe<T, Out>): BaseGenerator<Out> {
    if (!(t instanceof Transform)) {
      t = pipe(t);
    }
    return new BaseGenerator<Out>(t.apply(this as any));
  }

  public filter(test: Pipe<T, boolean>) {
    return this.pipe(new FilterTransform(test));
  }

  public sink<TSinkReturn>(writable: (gen: AsyncGenerator<T, TReturn, TNext>) => Promise<TSinkReturn>): Promise<TSinkReturn> {
    return writable(this);
  }
}

export class Generator<T = unknown, TReturn = any, TNext = unknown> extends BaseGenerator<T, TReturn, TNext> {
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

  public toFile(path: string) {
    return new FileGenerator(this.pipe(toFile(path)));
  }
}

export class FileGenerator<T, TReturn = any, TNext = any> extends BaseGenerator<File<T>, TReturn, TNext> {
  public read() {
    return new BufferedFileGenerator(this.pipe(toBufferedFile()));
  }

  public rename(path: string | ((file: File) => string)): this {
    return new (this.constructor as any)(
      this.pipe(async file => ({...file, path: typeof path === 'string' ? path : path(file)}))
    );
  }

  public content() {
    return this.pipe(async file => file.content);
  }

  public static fromPath(path: string | string[], protocol: AsyncFactory<FileAccess>): FileGenerator<AsyncGenerator<Buffer> | undefined> {
    async function* gen() {
      const fa = await protocol.create();
      for await (const file of fa.read(path)) {
        yield file;
      }
    }
    return new FileGenerator(gen());
  }
}

export class BufferedFileGenerator<TReturn = any, TNext = any>
  extends FileGenerator<Buffer, TReturn, TNext>
{
  public parse<Out = any>(serializer: IOGate<Pipe>) {
    return new ParsedFileGenerator(this.pipe<File<Out>>(transformInput([serializer], 'content')));
  }

  public write(protocol: AsyncFactory<FileAccess>) {
    return this.sink(toFileSystem(protocol));
  }
}

export class ParsedFileGenerator<T, TReturn = any, TNext = any>
  extends FileGenerator<T, TReturn, TNext>
{
  public serialize(serializer: IOGate<Pipe>) {
    return new BufferedFileGenerator(this.pipe<File<Buffer>>(transformOutput([serializer], 'content')));
  }
}