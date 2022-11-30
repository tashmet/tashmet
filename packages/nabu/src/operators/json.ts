import { Encoding } from "../interfaces";
import { transform } from "./common";

export interface JsonParserOptions {
  encoding?: Encoding;

  reviver?: (this: any, key: string, value: any) => any;
}

const defaultParserOptions: JsonParserOptions = {
  encoding: 'utf-8',
  reviver: undefined,
}

export function jsonParser(options?: JsonParserOptions) {
  const {encoding, reviver} = Object.assign({}, defaultParserOptions, options);
  return transform(file => ({
    ...file, content: JSON.parse(file.content.toString(encoding), reviver)
  }));
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

export function jsonSerializer(options?: JsonSerializerOptions) {
  const {encoding, replacer, space} = Object.assign({}, defaultSerializerOptions, options);
  return transform(file => file.content ? ({
    ...file, content: Buffer.from(JSON.stringify(file.content, replacer, space), encoding)
  }): file);
}

export type JsonOptions = JsonParserOptions & JsonSerializerOptions;
