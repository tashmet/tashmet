import { Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { JsonOptions } from '@tashmet/json';
import { YamlOptions } from '@tashmet/yaml';
import { ContentRule } from './content.js';
import { IOFactory } from './io.js';
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

export interface FileStorageConfig {
  content: ContentRule;

  scan: string;

  lookup: (id: string) => string;
}

export type NabuIOConfig = (ns: TashmetCollectionNamespace, options: Document) => IOFactory;

export interface NabuConfig {
  io: Record<string, NabuIOConfig>;

  defaultIO: string;

  json: JsonOptions;

  yaml: YamlOptions;

  markdown: MarkdownOptions;

  fs: FileSystemOptions;
}

export abstract class NabuConfig implements NabuConfig {}

