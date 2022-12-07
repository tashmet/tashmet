import { ContentReaderFunction, ContentWriterFunction, Encoding } from "../interfaces";

export interface JsonParserOptions {
  encoding?: Encoding;

  reviver?: (this: any, key: string, value: any) => any;
}

const defaultParserOptions: JsonParserOptions = {
  encoding: 'utf-8',
  reviver: undefined,
}

export interface JsonSerializerOptions {
  encoding?: Encoding;

  replacer?: (string | number)[] | null | undefined;

  space?: string | number | undefined;
}

const defaultSerializerOptions: JsonSerializerOptions = {
  encoding: 'utf-8',
  replacer: undefined,
  space: 2,
}

export type JsonOptions = JsonParserOptions & JsonSerializerOptions;

export const jsonReader: ContentReaderFunction<JsonParserOptions, Document> = async (content, options) => {
  const {encoding, reviver} = Object.assign({}, defaultParserOptions, options);

  return JSON.parse(content.toString(encoding), reviver)
}

export const jsonWriter: ContentWriterFunction<JsonSerializerOptions> = async (content, options) => {
  const {encoding, replacer, space} = Object.assign({}, defaultSerializerOptions, options);

  return Buffer.from(JSON.stringify(content, replacer, space), encoding)
}
