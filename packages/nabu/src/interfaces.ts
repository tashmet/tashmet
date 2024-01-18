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

export interface IO {
  readonly input: Document[];

  readonly output: Document[];
}

export abstract class IO implements IO {}

export abstract class BufferIO extends IO {
  public abstract readonly path: string;
}

export abstract class StreamIO extends IO {
  public abstract path(id?: string): string;
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

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;

  default?: Document;
}

export interface FileFormat {
  reader(expr: any): Document;
  writer(expr: any): Document;
}

export interface ArrayInFile extends ArrayInFileOptions{
  path: string;

  format: FileFormat | string;
}

export interface ObjectInFile extends ObjectInFileOptions {
  path: string;

  format: FileFormat | string;
}

export interface Directory extends ContentRuleOptions {
  path: string;

  extension: string;

  format: string;
}

export interface Glob extends ContentRuleOptions {
  pattern: string;

  format: string;
}

export type IODescription = 
  { arrayInFile: ArrayInFile } |
  { objectInFile: ObjectInFile } |
  { directory: Directory } |
  { glob: Glob };
