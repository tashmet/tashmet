import {Query} from '@tashmit/database';
import {Param} from '../interfaces';

const qsStringify = require('qs-stringify');

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

    return Object.entries<any>(filter)
      .reduce<Param[]>((params, [k, v]) => params.concat(makeParams(k, v)), [])
      .filter(p => p.value !== undefined)
      .map(p => p.toString())
      .join('&');
  }
}

export interface NestedFilterConfig {
  root: string | false;
}

const defaultNestedFilterConfig: NestedFilterConfig = {
  root: 'filter',
};

export const nestedFilter = (config?: Partial<NestedFilterConfig>) => {
  const {root} = Object.assign({}, defaultNestedFilterConfig, config);

  return (q: Query) => {
    return qsStringify(root ? {[root]: q.filter} : q.filter);
  }
}
