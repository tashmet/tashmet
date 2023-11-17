import { Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { JsonOptions } from '@tashmet/json';
import { YamlOptions } from '@tashmet/yaml';
import { FileSystemOptions } from '@tashmet/fs';
import { MarkdownOptions } from '@tashmet/markdown';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface File<T = any> extends Document {
  path: string;
  content: T;
  isDir: boolean;
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

export interface IO {
  readonly input: Document[];

  readonly output: Document[];
}

export abstract class BufferIO implements IO {
  public abstract readonly path: string;
  public abstract readonly input: Document[];
  public abstract readonly output: Document[];
}

export abstract class StreamIO implements IO {
  public abstract path(id?: string): string;
  public abstract readonly input: Document[];
  public abstract readonly output: Document[];
}

export type NabuIOConfig = (ns: TashmetCollectionNamespace, options: Document) => IO;

export interface NabuConfig {
  io: Record<string, NabuIOConfig>;

  defaultIO: string;

  json: JsonOptions;

  yaml: YamlOptions;

  markdown: MarkdownOptions;

  fs: FileSystemOptions;
}

export abstract class NabuConfig implements NabuConfig {}
