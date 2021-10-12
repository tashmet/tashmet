import {Filter} from '@ziqquratu/ziqquratu';
import {merge} from 'mingo/util';
import {parseQs} from './common';

const queryTypes = require('query-types');

export const rhsColon: OperatorParserConfig = {
  pattern: /(.*)\:(.*)/,
  rhs: true,
}

export const lhsColon: OperatorParserConfig = {
  pattern: /(.*)\:(.*)/,
  rhs: false,
}

export interface OperatorParserConfig {
  pattern: RegExp;
  rhs: boolean;
}

export interface FlatFilterConfig {
  exclude: string[];
  operator?: OperatorParserConfig;
}

export const flatFilter = (config: FlatFilterConfig) => (qs: string) => {
  let filter: Filter<any> = {};

  const toOperator = (op: string) => `$${op}`;
  const makeFilter = (field: string, op: string, value: string) =>
    ({[field]: {[toOperator(op)]: queryTypes.parseValue(value)}});

  const parseFilter = (lhs: string, rhs: string | string[], operatorConfig: OperatorParserConfig) => {
    if (operatorConfig.rhs) {
      let f: any = {};
      for (const rhsItem of Array.isArray(rhs) ? rhs : [rhs]) {
        const result = operatorConfig.pattern.exec(rhsItem);
        merge(f, result ? makeFilter(lhs, result[1], result[2]) : {});
      }
      return f;
    } else if (!Array.isArray(rhs)) {
      const result = operatorConfig.pattern.exec(lhs);
      if (result) {
        return makeFilter(result[1], result[2], rhs);
      }
    }
    return ({[lhs]: rhs});
  }

  const pqs = parseQs(qs, {types: true});
  for (const [lhs, rhs] of Object.entries<any>(pqs)) {
    if (!config.exclude.includes(lhs)) {
      merge(filter, config.operator
        ? parseFilter(lhs, rhs, config.operator)
        : ({[lhs]: rhs}));
    }
  }
  return {filter};
}

export interface NestedFilterConfig {
  param: string;
  types: boolean;
}

const defaultNestedFilterConfig: NestedFilterConfig = {
  param: 'filter', types: true,
}

export const nestedFilter = (config?: Partial<NestedFilterConfig>) => (qs: string) => {
  const {param, types} = Object.assign({}, defaultNestedFilterConfig, config);
  return {filter: parseQs(qs, {types})[param]};
}
