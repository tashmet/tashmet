import * as showdown from 'showdown';
import {Converter, ConverterFactory} from '../interfaces';

class MarkdownConverter {
  public constructor(private converter: showdown.Converter) {}

  public async publish(text: string): Promise<string> {
    return this.converter.makeHtml(text);
  }
}

export class MarkdownConverterFactory extends ConverterFactory {
  public constructor(private converter: showdown.Converter) {
    super();
  }

  public create(): Converter {
    return new MarkdownConverter(this.converter);
  }
}

export const markdown = (converter: showdown.Converter) => new MarkdownConverterFactory(converter);
