import {IOGate, Pipe} from '@ziqquratu/pipe';

type Encoding = 'utf-8' | 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex' | undefined;

/**
 * JSON parsing pipe 
 * 
 * @param buffer Buffer containing raw JSON data
 */
export function fromJson(encoding?: Encoding): Pipe<Buffer, any> {
  return async buffer => JSON.parse(buffer.toString(encoding));
}

/**
 * JSON serialization pipe 
 * 
 * @param obj JSON
 */
export function toJson(encoding?: Encoding): Pipe<any, Buffer> {
  return async obj => Buffer.from(JSON.stringify(obj), encoding);
}

export const json = (encoding?: Encoding) => ({
  input: fromJson(encoding),
  output: toJson(encoding)
}) as IOGate<Pipe>;
