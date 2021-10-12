import {Filter} from '@ziqquratu/ziqquratu';
import {merge} from 'mingo/util';
import {parseQs} from './common';

export const rhsColon: OperatorParserConfig = {
  pattern: new RegExp(/(.*?)\:(.*?)/),
  rhs: true,
}

export const lhsColon: OperatorParserConfig = {
  pattern: new RegExp(/(.*?)\:(.*?)/),
  rhs: false,
}

export interface OperatorParserConfig {
  pattern: RegExp;
  rhs: boolean;
}

export interface MultiParamFilterParserConfig {
  exclude: string[];
  operator?: OperatorParserConfig;
}

export const multiParamFilterParser = (config: MultiParamFilterParserConfig) => (qs: string) => {
  let filter: Filter<any> = {};

  const toOperator = (op: string) => `$${op}`;
  const makeFilter = (field: string, op: string, value: string) =>
    ({[field]: {[toOperator(op)]: value}});

  const parseFilter = (lhs: string, rhs: string, operatorConfig: OperatorParserConfig) => {
    if (operatorConfig.rhs) {
      const result = operatorConfig.pattern.exec(rhs);
      if (result) {
        return makeFilter(lhs, result[1], result[2]);
      }
    } else {
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
        ? parseFilter(lhs, rhs?.toString() || '', config.operator)
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
