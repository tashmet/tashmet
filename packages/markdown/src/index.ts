import * as showdown from 'showdown';
import {io, IOGate} from '@ziqquratu/pipe';

class MarkdownConverter implements IOGate {
  public constructor(
    private converter: showdown.Converter,
    private keys: string[]
  ) {}
  
  public async input(doc: any): Promise<any> {
    return this.convert(doc, html => this.converter.makeMarkdown(html));
  }

  public async output(doc: any): Promise<any> {
    return this.convert(doc, markdown => this.converter.makeHtml(markdown));
  }

  private convert(doc: any, fn: (input: string) => string): any {
    const clone = Object.assign({}, doc);
    for (const key of this.keys) {
      if (doc.hasOwnProperty(key)) {
        clone[key] = fn(doc[key]);
      }
    }
    return clone;
  }
}

export interface MarkdownConfig {
  converter: showdown.Converter;

  key: string | string[];
}

export const markdown = (config: MarkdownConfig) =>
  io(new MarkdownConverter(config.converter, ([] as string[]).concat(config.key)));
