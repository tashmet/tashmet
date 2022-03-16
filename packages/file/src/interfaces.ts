import { StoreConfig } from "@tashmit/database";
import {Pipeline} from "./pipeline";

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Pipe<TIn = any, TOut = TIn> = (input: TIn) => Promise<TOut>;

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

export interface Serializer<T = any> extends Duplex {
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

//export class FileAccessFactory extends Factory<FileAccess> {};
/*
export interface FileStreamConfig<T> {
  driver?: FileAccessFactory;
}
*/

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

export interface Duplex {
  input: Pipe;
  output: Pipe;
}

export interface FileConfig<T extends object, TStored = T> {
  /**
   * Path to the file containing the collection.
   */
  path: string;

  /**
   * A serializer that will parse and serialize incoming and outgoing data.
   */
  serializer: Serializer<TStored[] | Record<string, TStored>>;

  /**
   * Stream the collection as a dictionary instead of a list
   *
   * If set the collection will be streamed as a dictionary with keys
   * being the IDs of each document.
   *
   * @default false
   */
  dictionary?: boolean;

  /**
   * An optional pipe that can modify incoming documents after they have been parsed.
   */
  afterParse?: Pipe<TStored, T>;

  /**
   * An optional pipe that can modify outgoing documents before the they are
   * serialized and written to the file system.
   *
   * This is a good opportunity to, for instance, remove run-time data that
   * does not need to be persisted.
   */
  beforeSerialize?: Pipe<T, TStored>;
}

export interface DirectoryConfig<T> {
  /**
   * Path to the directory to where the files reside
   */
  path: string;

  /**
   * Extension of the files.
   *
   * Should be provided without a dot, ie 'json' or 'yaml' etc. This both serves
   * as a filter for incoming files, as well as a basis for determining the
   * name of outgoing files if the content is extracted.
   */
  extension: string;
}

export type DirectoryFilesConfig<T = any, TStored = T> =
  PartialBy<DirectoryConfig<T>, 'extension'> & MultiFilesWithContentConfig<T, TStored>;

export type DirectoryContentConfig<T = any, TStored = T> =
  DirectoryConfig<T> & FileContentConfig<T, TStored> & ExtractedFileContentConfig<T>;

  export type ShardOutput<T> = (source: Pipeline<T>, deletion: boolean) => Promise<void>;
