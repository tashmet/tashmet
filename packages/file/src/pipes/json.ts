import {Pipe} from '@tashmit/pipe';

export type JsonEncoding = 'utf-8' | 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex' | undefined;

/**
 * JSON parsing pipe
 *
 * @param buffer Buffer containing raw JSON data
 */
export function fromJson(encoding?: JsonEncoding): Pipe<Buffer, any> {
  return async buffer => JSON.parse(buffer.toString(encoding));
}

/**
 * JSON serialization pipe
 *
 * @param obj JSON
 */
export function toJson(encoding?: JsonEncoding): Pipe<any, Buffer> {
  return async obj => Buffer.from(JSON.stringify(obj), encoding);
}
