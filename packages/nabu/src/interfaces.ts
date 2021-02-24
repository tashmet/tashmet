import {IOGate, Pipe} from "@ziqquratu/pipe";
import {Generator} from "./generator";

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface File<T = any> {
  path: string;
  content: T;
  isDir: boolean;
}

export type ReadableFile = File<AsyncGenerator<Buffer> | undefined>;

export abstract class FileAccess {
  public abstract read(path: string | string[]): Generator<ReadableFile>;

  public abstract write(files: AsyncGenerator<File<Buffer>>): Promise<void>;

  public abstract remove(files: AsyncGenerator<File>): Promise<void>;

  public watch(globs: string | string[], deletion?: boolean): Generator<File> | null {
    return null;
  }
}

export type GeneratorSink<T = any, TReturn = any> = (gen: AsyncGenerator<T>) => Promise<TReturn>;

export interface Serializer<T = any> extends IOGate<Pipe> {
  input: Pipe<Buffer, T>;
  output: Pipe<T, Buffer>;
}


export interface FileContentConfig<T, TStored = T> {
  /**
   * The serializer used to parsing and serializing the content, ie json() or yaml().
   */
  serializer: Serializer<TStored>;

  /**
   * An optional pipe that can modify incoming files (and their content)
   * after the content has been parsed.
   */
  afterParse?: Pipe<File<TStored>, File<T>>;

  /**
   * An optional pipe that can modify outgoing files (and their content)
   * before the content is serialized and written to the file system.
   * 
   * This is a good opportunity to, for instance, remove run-time data that
   * does not need to be persisted.
   */
  beforeSerialize?: Pipe<File<T>, File<TStored>>;
}
