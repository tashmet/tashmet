import { Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { JsonOptions } from '@tashmet/json';
import { YamlOptions } from '@tashmet/yaml';
import { FileSystemOptions } from '@tashmet/fs';
import { MarkdownOptions } from '@tashmet/markdown';
import { ArrayInFileOptions } from './io/arrayInFile';
import { ObjectInFileOptions } from './io/objectInFile';

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

export abstract class BufferIO {
  abstract readonly input: Document[];

  abstract readonly output: Document[];

  abstract readonly path: string;

  async drop() {}
}

export abstract class StreamIO {
  abstract readonly input: Document[];

  abstract output(mode: 'insert' | 'update' | 'delete'): Document[];

  abstract path(id?: string): string;

  async drop() {}
}

export type NabuIOConfig = (ns: TashmetCollectionNamespace, options: Document) => Document;

export interface NabuConfig {
  persistentState: false | ((dbName: string) => string);

  io: Record<string, NabuIOConfig>;

  defaultIO: string;

  json: JsonOptions;

  yaml: YamlOptions;

  markdown: MarkdownOptions;

  fs: FileSystemOptions;
}

export abstract class NabuConfig implements NabuConfig {}

export interface FileFormat {
  reader: Document[];
  writer: Document[];
}

export interface ArrayInFile extends ArrayInFileOptions{
  path: string;

  format: FileFormat | string;
}

export interface ObjectInFile extends ObjectInFileOptions {
  path: string;

  format: FileFormat | string;
}

export interface Directory {
  path: string;

  extension: string;

  format: string;

  mergeStat?: Document;

  construct?: Document;

  default?: Document;
}

export interface Glob {
  pattern: string;

  format: string;

  mergeStat?: Document;

  construct?: Document;

  default?: Document;
}

export type IODescription = 
  { arrayInFile: ArrayInFile } |
  { objectInFile: ObjectInFile } |
  { directory: Directory } |
  { glob: Glob };
