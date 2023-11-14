import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { FSFactory } from './fs.js';

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}

export abstract class IORule {
  public directory(path: string, extension: string, options?: ContentRuleOptions) {
    const merge = Object.assign(
      { _id: { $basename: ['$path', { $extname: '$path' }] } }, options?.merge
    );

    const content = ContentRule
      .fromRootReplace(this.reader, this.writer, merge)
      .assign(options?.construct || {})

    return new FSFactory({
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

    return new FSFactory({
      lookup: id => id,
      scan: pattern,
      content,
    });
  }

  protected abstract get reader(): Document;
  protected abstract get writer(): Document;
}
