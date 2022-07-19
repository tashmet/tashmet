import { Document } from '@tashmet/tashmet';
import { File, FileConfig, ManyFilesInputConfig, ManyFilesOutputConfig } from "../interfaces";

export interface Writable<T> extends AsyncGenerator<T | undefined, void, T> {}

/**
 * An async iterator with support for aggregation.
 */
export interface AggregatableStream<T> extends AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T, void>;

  aggregate(pipeline: Document[]): DocumentStream<T>;

  toArray(): Promise<T[]>;

  write(writable: Writable<T>): Promise<void>;
}

/**
 * An aggregatable stream of files
 */
export interface FileStream extends AggregatableStream<File<Buffer>> {
  /**
   * Load a 
   * 
   * @param config 
   */
  loadBundle<T extends Document = Document>(config: FileConfig): DocumentStream<T>
  loadFiles<T extends Document = Document>(config: ManyFilesInputConfig): DocumentStream<T>
}

/**
 * An aggregatable stream of documents
 */
export interface DocumentStream<T extends Document = Document> extends AggregatableStream<T> {
  /**
   * Create a single file that contains all documents in the stream
   * 
   * @param config 
   */
  createBundle(config: FileConfig): FileStream;

  /**
   * Create a stream where each document is turned into a file.
   * 
   * @param config 
   */
  createFiles(config: ManyFilesOutputConfig): FileStream;
}

export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}
