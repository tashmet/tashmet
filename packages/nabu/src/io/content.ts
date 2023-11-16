import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { FileBufferFactory, FileStreamFactory } from './fs.js';

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}

export interface FileOptions {
  id: Document | string;

  dictionary?: boolean;

  includeArrayIndex?: string;
}

export abstract class IORule {
  public directory(path: string, extension: string, options?: ContentRuleOptions) {
    const merge = Object.assign(
      { _id: { $basename: ['$path', { $extname: '$path' }] } }, options?.merge
    );

    const content = ContentRule
      .fromRootReplace(this.reader, this.writer, merge)
      .assign(options?.construct || {})

    return new FileStreamFactory({
      scan: `${path}/*${extension}`,
      lookup: id => `${path}/${id}${extension}`,
      content,
    });
  }

  public glob(pattern: string, options?: ContentRuleOptions) {
    const merge = Object.assign({ _id: '$path' }, options?.merge);

    const content = ContentRule
      .fromRootReplace(this.reader, this.writer, merge)
      .assign(options?.construct || {})

    return new FileStreamFactory({
      lookup: id => id,
      scan: pattern,
      content,
    });
  }

  public file(path: string, options: FileOptions) {
    return new FileBufferFactory({ path, reader: this.reader, writer: this.writer, options });
  }

  protected abstract get reader(): Document;
  protected abstract get writer(): Document;
}
