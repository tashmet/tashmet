import { Document } from "@tashmet/tashmet";
import { FileStreamIO } from "./fileStream.js";
import { FileBufferIO } from "./fileBuffer.js";

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

    return new FileStreamIO(
      id => id ? `${path}/${id}${extension}` : `${path}/*${extension}`,
      this.reader,
      this.writer,
      merge,
      options?.construct
    );
  }

  public glob(pattern: string, options?: ContentRuleOptions) {
    const merge = Object.assign({ _id: '$path' }, options?.merge);

    return new FileStreamIO(id => id ? id : pattern, this.reader, this.writer, merge, options?.construct);
  }

  public file(path: string, options: FileOptions) {
    return new FileBufferIO(path, this.reader, this.writer, options);
  }

  protected abstract get reader(): Document;
  protected abstract get writer(): Document;
}
