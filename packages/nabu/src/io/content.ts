import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { FSFactory } from './fs.js';

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}

export abstract class IORule<TConfig extends ContentRuleOptions> {
  public constructor(protected config: TConfig) {}

  public directory(path: string, extension: string) {
    const merge = { _id: { $basename: ['$path', { $extname: '$path' }] } };
    const contentConfig = { ...this.config, merge: { ...this.config.merge, ...merge } };

    return new FSFactory({
      scan: `${path}/*${extension}`,
      lookup: id => `${path}/${id}${extension}`,
      content: this.contentRule(contentConfig),
    });
  }

  public glob(pattern: string) {
    const merge = { _id: '$path' };
    const contentConfig = { ...this.config, merge: { ...this.config.merge, ...merge } };

    return new FSFactory({
      lookup: id => id,
      scan: pattern,
      content: this.contentRule(contentConfig),
    });
  }

  protected abstract contentRule(config: TConfig): ContentRule;
}
