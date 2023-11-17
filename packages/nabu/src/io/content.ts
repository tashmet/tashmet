import { Document } from "@tashmet/tashmet";
import { FileStreamIO } from "./fileStream.js";
import { ArrayInFileIO, ArrayInFileOptions } from "./arrayInFile.js";

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}


export abstract class IORule {
  public directory(path: string, extension: string, options?: ContentRuleOptions) {
    const merge = Object.assign(
      { _id: { $basename: ['$path', { $extname: '$path' }] } }, options?.merge
    );

    return new FileStreamIO(
      id => id ? `${path}/${id}${extension}` : `${path}/*${extension}`,
      this.reader.bind(this),
      this.writer.bind(this),
      merge,
      options?.construct
    );
  }

  public glob(pattern: string, options?: ContentRuleOptions) {
    const merge = Object.assign({ _id: '$path' }, options?.merge);

    return new FileStreamIO(id => id ? id : pattern, this.reader.bind(this), this.writer.bind(this), merge, options?.construct);
  }

  public arrayInFile(path: string, options?: ArrayInFileOptions) {
    return new ArrayInFileIO(path, this.reader.bind(this), this.writer.bind(this), options);
  }

  protected abstract reader(expr: any): Document;
  protected abstract writer(expr: any): Document;
}
