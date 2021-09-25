import {QueryOptions, SortingDirection, SortingMap} from '@ziqquratu/database';

export type ParamSerializer = (v: any) => string[];
export const jsonParam = (name: string) => (v: any) => [`${name}=${JSON.stringify(v)}`];

export interface QuerySerializer {
  filter: (v: any) => string | string[];
  skip: (v: number) => string | string[];
  limit: (v: number) => string | string[];
  sort: (v: SortingMap) => string | string[];
}

export interface SortSerializerConfig {
  param: string;
  ascending: (key: string) => string;
  descending: (key: string) => string;
  separator: string;
}

const serializeSort = (config: SortSerializerConfig) => {
  return (sort: SortingMap) => ({[config.param]: Object.keys(sort)
    .map(k => sort[k] === SortingDirection.Ascending
      ? config.ascending(k)
      : config.descending(k)
    )
    .join(config.separator)
  });
}

export const lhsBrackets: OperatorFormat = (k, v, op) => `${k}[${op}]=${v}`;
export const lhsColon: OperatorFormat = (k, v, op) => `${k}:${op}=${v}`;
export const rhsColon: OperatorFormat = (k, v, op) => `${k}=${op}:${v}`


export type OperatorFormat = (key: string, value: any, op: string) => string;
export type OperatorMap = Record<string, string | OperatorFormat>

export interface FilterSerializerConfig {
  alias?: (op: string) => string;
  format: OperatorFormat;
}

export const serializeFilter = (config: FilterSerializerConfig) => {
  const defaultAlias = (op: string) => op.substr(1);
  const alias = config.alias || defaultAlias;

  return (filter: any) => {
    const format = (key: string, value: any, op: string) => {
      if (op === '$eq') {
        return `${key}=${value}`;
      }
      return config.format(key, value, alias(op));
    }

    const serializeValue = (v: any): any =>
      Array.isArray(v) ? v.map(serializeValue).join(',') : v;

    let params: string[] = [];
    for (const k of Object.keys(filter)) {
      const v = filter[k];
      if (typeof v === 'object' && !Array.isArray(v)) {
        for (const op of Object.keys(v)) {
          params.push(format(k, serializeValue(v[op]), op));
        }
      } else {
        params.push(`${k}=${serializeValue(v)}`);
      }
    }
    return params;
  }
}

export const queryParams: QuerySerializer = {
  filter: jsonParam('filter'),
  sort: jsonParam('sort'),
  skip: v => `sort=${v.toString()}`,
  limit: v => `limit=${v.toString()}`,
}

export function makeQueryParams(
  filter: any, options: QueryOptions, serializer: QuerySerializer
) {
  const {sort, skip, limit} = options;
  let params: string[] = [];
  if (Object.keys(filter).length > 0) {
    params = params.concat(serializer.filter(filter));
  }
  if (sort) {
    params = params.concat(serializer.sort(sort));
  }
  if (skip) {
    params = params.concat(serializer.skip(skip));
  }
  if (limit) {
    params = params.concat(serializer.limit(limit));
  }
  return params;
}

export function serializeQuery(
  filter: object, options: QueryOptions, serializer: QuerySerializer, path: string
) {
  const params = makeQueryParams(filter, options, serializer);

  let query = path;
  if (params.length > 0) {
    query = query + '?' + params.map(p => encodeURIComponent(p)).join('&');
  }
  return query;
}
