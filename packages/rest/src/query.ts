import {QueryOptions, SortingDirection, SortingMap} from '@ziqquratu/database';
import {JsonQueryConfig} from './interfaces';

const param = (key: string, value: string | number) => `${key}=${value}`;

export type ParamSerializer = (v: any) => string[];
export const jsonParam = (name: string) => (v: any) => param(name, JSON.stringify(v));

export interface QuerySerializer {
  filter: (v: any) => string | string[];
  sort: (v: SortingMap) => string | string[];
  skip?: string | false;
  limit?: string | false;
}

export interface SortSerializerConfig {
  param: string;
  ascending: (key: string) => string;
  descending: (key: string) => string;
  separator: string;
}

const defaultSortSerializerConfig: SortSerializerConfig = {
  param: 'sort', ascending: k => `+${k}`, descending: k => `-${k}`, separator: ',',
}

export const serializeSort = (config?: Partial<SortSerializerConfig>) => {
  const {param, ascending, descending, separator} = Object.assign(
    {}, defaultSortSerializerConfig, config);

  return (sort: SortingMap) => {
    const value = Object.keys(sort)
      .map(k => sort[k] === SortingDirection.Ascending
        ? ascending(k) : descending(k)
      )
      .join(separator)
    return `${param}=${value}`;
  }
}

export const lhsBrackets: OperatorFormat = (k, v, op) => param(`${k}[${op}]`, v);
export const lhsColon: OperatorFormat = (k, v, op) => param(`${k}:${op}`, v);
export const rhsColon: OperatorFormat = (k, v, op) => param(k, `${op}:${v}`);

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
      return (op === '$eq')
        ? param(key, value)
        : config.format(key, value, alias(op));
    }

    const serializeValue = (v: any): any =>
      Array.isArray(v) ? v.map(serializeValue).join(',') : v;

    const isExpr = (v: any) => typeof v === 'object' && !Array.isArray(v);
    const makeParams = (k: string, v: any) => isExpr(v)
      ? Object.keys(v).map(op => format(k, serializeValue(v[op]), op))
      : param(k, serializeValue(v))

    return Object.entries<any>(filter).reduce((params, [k, v]) =>
      params.concat(makeParams(k, v))
    , [] as string[]);
  }
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
  if (skip && serializer.skip !== false) {
    params = params.concat(param(serializer.skip || 'skip', skip));
  }
  if (limit && serializer.limit !== false) {
    params = params.concat(param(serializer.limit || 'limit', limit));
  }
  return params;
}

export class HttpQueryBuilder {
  public constructor(
    private path: string,
    private serializer: QuerySerializer,
  ) {}

  public serialize(filter: object = {}, options: QueryOptions = {}) {
    const params = makeQueryParams(filter, options, this.serializer);
    return params.length > 0
      ? this.path + '?' + params.join('&')
      : this.path;
  }
}

export const jsonQuery = (config?: JsonQueryConfig) => {
  return {
    filter: jsonParam(config?.filter || 'filter'),
    sort: jsonParam(config?.sort || 'sort'),
    skip: config?.skip,
    limit: config?.limit,
  } as QuerySerializer;
}
