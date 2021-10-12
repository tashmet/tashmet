import {Query} from '@ziqquratu/ziqquratu';
import {merge, hashCode} from 'mingo/util';
import {parse} from 'qs';

const queryTypes = require('query-types');

export type QueryParser = (qs: string) => Query;
export type PartialQueryParser = (qs: string) => Partial<Query>

export interface ParseQsOptions {
  types: boolean;
}

let qsHashTable: Record<string, any> = {}

export function cacheOrEval<T>(records: Record<string, T>, value: any, fn: (value: any) => T) {
  const hash = hashCode(value);
  let result: T;
  if (hash) {
    result = records[hash];
    if (!result) {
      result = (records[hash] = fn(value));
    }
    return result;
  } else {
    return fn(value);
  }
}

export function parseQs(qs: string, options?: ParseQsOptions) {
  const pqs = cacheOrEval(qsHashTable, qs, parse);
  return options?.types
    ? queryTypes.parseObject(pqs)
    : pqs;
}

export const intParamParser = (part: 'skip' | 'limit', param?: string) => {
  return (qs: string) => {
    const pqs = parseQs(qs);
    return (param || part) in pqs
    ? ({[part]: parseInt(pqs[param || part] as string)})
    : ({});
  }
}

export const makeQuery = (qs: string, parsers: PartialQueryParser[]) => {
  let query: Query = {};
  for (const p of parsers) {
    merge(query as any, p(qs));
  }
  return query;
}
