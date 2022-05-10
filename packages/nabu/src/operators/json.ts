import { Options } from "mingo/core";
import { Iterator } from "mingo/lazy";
import { RawObject } from "mingo/types";
import { setValue, resolve } from "mingo/util";
import { Encoding, Transform } from "../interfaces";

/**
 * Parse JSON from a buffer.
 *
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
export function $jsonParse(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  return collection.map((obj: RawObject) => {
    const newObj = { ...obj };
    const key = expr['key'] as string || 'content';
    const encoding = expr['encoding'] as Encoding || 'utf8';
    const buffer = resolve(obj, key) as Buffer;

    setValue(newObj, key, JSON.parse(buffer.toString(encoding)));

    return newObj;
  });
}

/**
 * Serialize JSON to a buffer.
 * 
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
export function $jsonDump(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  return collection.map((obj: RawObject) => {
    const newObj = { ...obj };
    const key = expr['key'] as string || 'content';
    const encoding = expr['encoding'] as Encoding || 'utf8';

    setValue(newObj, key, Buffer.from(JSON.stringify(resolve(obj, key)), encoding));

    return newObj;
  });
}

export const json = (encoding: Encoding = 'utf8') => {
  return {
    input: [{$jsonParse: {key: 'content', encoding}}],
    output: [{$jsonDump: {key: 'content', encoding}}],
  } as Transform;
}
