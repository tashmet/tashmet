import {QueryOptions, SortingDirection, SortingMap} from '@ziqquratu/database';

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
        return param(key, value);
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
        params.push(param(k, serializeValue(v)));
      }
    }
    return params;
  }
}

export const queryParams: QuerySerializer = {
  filter: jsonParam('filter'),
  sort: jsonParam('sort'),
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
