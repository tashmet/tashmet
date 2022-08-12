import { Options, computeValue } from "mingo/core";
import { RawObject, AnyVal } from "mingo/types";
import { Encoding, Transform } from "../interfaces";

/**
 * Parse JSON from a buffer.
 *
 * @param {Object} obj
 * @param {Object} expr
 * @param {Options} options
 */
export function $jsonParse(
  obj: RawObject,
  expr: RawObject,
  options?: Options
): AnyVal {
  const encoding = expr['encoding'] as Encoding || 'utf8';
  const buffer = computeValue(obj, expr['buffer']) as Buffer;

  return JSON.parse(buffer.toString(encoding));
}

/**
 * Serialize JSON to a buffer.
 * 
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
export function $jsonDump(
  obj: RawObject,
  expr: RawObject,
  options?: Options
): AnyVal {
    const encoding = expr['encoding'] as Encoding || 'utf8';
    const data = computeValue(obj, expr['object']);

    return data ? Buffer.from(JSON.stringify(data), encoding) : undefined;
}

export const json = (encoding: Encoding = 'utf8') => {
  return {
    input: [{$set: {content: {$jsonParse: {buffer: '$content', encoding}}}}],
    output: [{$set: {content: {$jsonDump: {object: '$content', encoding}}}}],
  } as Transform;
}
