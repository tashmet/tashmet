import { AbstractCursor, Document } from '@tashmet/tashmet';
import { Stream } from './stream';

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
  source(uri: string, options?: Document): Stream;

  source<T extends Document>(docs: T[]): Stream<T>;
  
  source<T extends Document>(it: AsyncIterable<T>): Stream<T>;

  source<T extends Document>(cursor: AbstractCursor<T>): Stream<T>;
}

export interface UriPattern {
  readonly pattern: RegExp;
}

export interface FileReader extends UriPattern {
  read(uri: string | string[], options?: Document): AsyncGenerator<ReadableFile>;
}

export interface FileWriter extends UriPattern {
  write(files: AsyncIterable<File<any>>, options?: Document): Promise<void>;
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

  public async write(files: AsyncIterable<File<Buffer>>, options?: Document): Promise<void> {
    for (const w of this.writers) {
      await this.writeToWriter(w, files, options);
    }
  }

  private async writeToWriter(
    writer: FileWriter,
    files: AsyncIterable<File<Buffer>>,
    options?: Document
  ): Promise<void> {
    async function *gen() {
      for await (const file of files) {
        if (writer.pattern.test(file.path)) {
          yield file;
        }
      }
    }
    await writer.write(gen(), options);
  }

  public watch(globs: string | string[], deletion?: boolean): AsyncGenerator<File> | null {
    throw new Error("watch not implemented");
  }
}

export abstract class ContentReader {
  public abstract read(content: any, options: Document): Promise<any>;

  public abstract register(name: string, reader: ContentReaderFunction): void;
}

export abstract class ContentWriter {
  public abstract write(content: any, options: Document): Promise<any>;

  public abstract register(name: string, writer: ContentWriterFunction): void;
}

export type ContentReaderFunction<TOptions = Document, TResult = any> = (content: any, options: TOptions) => Promise<TResult>;
export type ContentWriterFunction<TOptions = Document> = (content: any, options: TOptions) => Promise<Buffer>;

export function fileExtension(path: string) {
  const matches = /(?:\.([^.]+))?$/.exec(path);
  if (matches) {
    return matches[1];
  }
  throw new Error(`Could not determine file extension from path: '${path}'`);
}
