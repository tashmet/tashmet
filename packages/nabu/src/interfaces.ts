import { AbstractCursor, Collection, Document } from '@tashmet/tashmet';
import { Stream } from './stream.js';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface File<T = any> extends Document {
  path: string;
  content: T;
  isDir: boolean;
}

export type ReadableFile = File<Buffer> | File<AsyncGenerator<Buffer> | undefined>;

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

  dictionary: boolean;
}

export interface FileStorageConfig {
  scan: string;

  lookup: (id: string) => string;

  read?: Document[];

  write?: Document[];
}

export interface ContentRule {
  parse: Document;

  serialize: Document;
}


export type NabuDatabaseConfig = (coll: string) => FileStorageConfig;

export interface NabuConfig {
  databases: Record<string, NabuDatabaseConfig>;

  contentRules?: Record<string, ContentRule>;
}

export abstract class NabuConfig implements NabuConfig {}


export interface StreamProvider {
  source(uri: string, options?: Document): Stream;

  source<T extends Document>(docs: T[]): Stream<T>;
  
  source<T extends Document>(it: AsyncIterable<T>): Stream<T>;

  source<T extends Document>(cursor: AbstractCursor<T>): Stream<T>;

  source<T extends Document>(collection: Collection<T>): Stream<T>;
}

export interface UriPattern {
  readonly pattern: RegExp;
}

export interface FileReader extends UriPattern {
  read(uri: string | string[], options?: Document): AsyncGenerator<ReadableFile>;
}

export interface FileWriter extends UriPattern {
  write(files: AsyncIterable<File<any>>, options?: Document): Promise<any>;
}

export interface FileWatcher extends UriPattern {
  watch(globs: string | string[], deletion?: boolean): AsyncGenerator<ReadableFile>;
}

export class FileAccess {
  private readers: FileReader[] = [];
  private writers: FileWriter[] = [];
  private watchers: FileWatcher[] = [];

  public registerReader(reader: FileReader) {
    this.readers.push(reader);
  }

  public registerWriter(writer: FileWriter) {
    this.writers.push(writer);
  }

  public read(uri: string | string[], options?: Document): AsyncGenerator<File> {
    if (Array.isArray(uri)) {
      throw new Error("No support for multiple uris yet");
    }

    let reader: FileReader | undefined;
    for (const r of this.readers) {
      if (r.pattern.test(uri)) {
        reader = r;
        break;
      }
    }

    if (reader == undefined) {
      throw new Error("No file reader found for uri");
    }
    return reader.read(uri, options);
  }

  public async write(files: AsyncIterable<File<Buffer>>): Promise<any[]> {
    const writeErrors: any[] = [];

    for (const w of this.writers) {
      const res =  await this.writeToWriter(w, files);
      writeErrors.push(...res);
    }
    return writeErrors;
  }

  private async writeToWriter(
    writer: FileWriter,
    files: AsyncIterable<File<Buffer>>
  ): Promise<any> {
    async function *gen() {
      for await (const file of files) {
        if (writer.pattern.test(file.path)) {
          yield file;
        }
      }
    }
    return writer.write(gen());
  }

  public watch(globs: string | string[], deletion?: boolean): AsyncGenerator<File> | null {
    throw new Error("watch not implemented");
  }
}
