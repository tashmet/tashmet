import { AsyncFactory } from "@ziqquratu/core";
import {IOGate, Pipe} from "@ziqquratu/pipe";
import {Pipeline} from "./pipeline";

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface File<T = any> {
  path: string;
  content: T;
  isDir: boolean;
}

export type ReadableFile = File<AsyncGenerator<Buffer> | undefined>;

export abstract class FileAccess {
  public abstract read(path: string | string[]): Pipeline<ReadableFile>;

  public abstract write(files: Pipeline<File<Buffer>>): Promise<void>;

  public abstract remove(files: Pipeline<File>): Promise<void>;

  public watch(globs: string | string[], deletion?: boolean): Pipeline<File> | null {
    return null;
  }
}

export type PipelineSink<T = any, TReturn = any> = (pipeline: Pipeline<T>) => Promise<TReturn>;

export interface Serializer<T = any> extends IOGate<Pipe> {
  /**
   * Input pipe for parsing a buffer into the desired type.
   */
  input: Pipe<Buffer, T>;

  /**
   * Output pipe for serializing a document into a buffer.
   */
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

export interface ExtractedFileContentConfig<T> {
  /**
   * Determine the file system path a document that is about to be persisted.
   */
  resolvePath?: Pipe<T, string>;

  /**
   * An optional pipe for determining the ID of incoming documents.
   */
  resolveId?: Pipe<File<T>, string>;
}

export interface FileStreamConfig<T> {
  /**
   * The underlying file system driver to use.
   */
  driver: AsyncFactory<FileAccess>;
}

export interface MultiFilesWithContentConfig<T, TStored> {
  /**
   * Strategy for reading and writing content
   * 
   * When set to false, content will be an async generator that can be consumed
   * at a later point and when true the content will be read into a buffer.
   * 
   * If the content should be parsed a configuration for how to do that can be
   * given instead.
   */
  content?: FileContentConfig<T, TStored> | boolean;
}