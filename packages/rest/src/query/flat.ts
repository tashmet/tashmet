import {SortingDirection} from '@ziqquratu/database';
import {Param, Query} from '../interfaces';
import {HttpQueryBuilder, limitParam, singleParam, skipParam} from "../query";

export interface FlatSortConfig {
  param: string;
  asc: (key: string) => string;
  desc: (key: string) => string;
  separator: string;
}

const defaultFlatSortConfig: FlatSortConfig = {
  param: 'sort', asc: k => `+${k}`, desc: k => `-${k}`, separator: ',',
}

export const flatSort = (config?: Partial<FlatSortConfig>) => {
  const {param, asc, desc, separator} = Object.assign(
    {}, defaultFlatSortConfig, config);

  return singleParam(q =>
    new Param(param, Object.entries(q.sort || {})
      .filter(([k, v ]) => v !== undefined)
      .map(([k, v]) => v === SortingDirection.Ascending ? asc(k) : desc(k))
      .join(separator))

  );
}

export const lhsBrackets: OperatorFormat = (k, v, op) => new Param(`${k}[${op}]`, v);
export const lhsColon: OperatorFormat = (k, v, op) => new Param(`${k}:${op}`, v);
export const rhsColon: OperatorFormat = (k, v, op) => new Param(k, `${op}:${v}`);

export type OperatorFormat = (key: string, value: any, op: string) => Param;
export type OperatorMap = Record<string, string | OperatorFormat>

export interface FlatFilterConfig {
  alias?: (op: string) => string;
  format: OperatorFormat;
}

export const flatFilter = (config: FlatFilterConfig) => {
  const defaultAlias = (op: string) => op.substr(1);
  const alias = config.alias || defaultAlias;

  return (q: Query) => {
    const filter = q.filter || {};
    const format = (key: string, value: any, op: string) => {
      return (op === '$eq')
        ? new Param(key, value)
        : config.format(key, value, alias(op));
    }

    const serializeValue = (v: any): any =>
      Array.isArray(v) ? v.map(serializeValue).join(',') : v;

    const isExpr = (v: any) => typeof v === 'object' && !Array.isArray(v);
    const makeParams = (k: string, v: any) => isExpr(v)
      ? Object.keys(v).map(op => format(k, serializeValue(v[op]), op))
      : new Param(k, serializeValue(v))

    return Object.entries<any>(filter).reduce((params, [k, v]) =>
      params.concat(makeParams(k, v))
    , [] as Param[]);
  }
}

export interface FlatQueryConfig {
  filter?: FlatFilterConfig;
  sort?: FlatSortConfig;
  skip?: string;
  limit?: string;
}

export const flatQuery = (config?: FlatQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    flatFilter(config?.filter || {format: lhsColon}),
    flatSort(config?.sort),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ], p => p.value === undefined);
