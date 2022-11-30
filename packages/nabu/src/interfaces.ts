import { Document } from '@tashmet/tashmet';
import { Stream } from './stream';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface File<T = any> extends Document {
  path: string;
  content: T;
  isDir: boolean;
}

export type ReadableFile = File<Buffer> | File<AsyncGenerator<Buffer> | undefined>;


export abstract class FileAccess {
  public abstract read(path: string | string[]): AsyncGenerator<ReadableFile>;

  public abstract write(files: AsyncIterable<File<Buffer>>): Promise<void>;

  public watch(globs: string | string[], deletion?: boolean): AsyncGenerator<File> | null {
    return null;
  }
}

export type Encoding =
  'utf-8' |
  'ascii' |
  'utf8' |
  'utf16le' |
  'ucs2' |
  'ucs-2' |
  'base64' |
  'latin1' |
  'binary' |
  'hex' |
  undefined;


export interface DatabaseBundleConfig {
  databaseBundle: string;

  dictionary: boolean;
}

export interface CollectionBundleConfig {
  collectionBundle: (collection: string) => string;

  glob?: string;

  format: string;

  dictionary: boolean;
}

export interface DocumentBundleConfig {
  documentBundle: (collection: string, id?: string) => string;

  format: string;

  id?: (file: File) => string;
}

export type NabuDatabaseConfig = DatabaseBundleConfig | CollectionBundleConfig | DocumentBundleConfig;

export interface NabuConfig {
  databases: Record<string, NabuDatabaseConfig>;
}

export abstract class NabuConfig implements NabuConfig {}


export interface StreamProvider {
  read(pathOrGlob: string): Stream;

  generate(docs: Document[]): Stream;
}
