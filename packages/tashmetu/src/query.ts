import {Filter, Query, SortingMap, SortingDirection, Projection} from '@ziqquratu/ziqquratu';
import {merge} from 'mingo/util';
import {ParsedQs, parse} from 'qs';

const queryTypes = require('query-types');

export type QueryParser = (qs: ParsedQs) => Query;
export type PartialQueryParser = (qs: ParsedQs) => Partial<Query>

export interface ParseQsOptions {
  types: boolean;
}

function parseQs(qs: string, options?: ParseQsOptions) {
  const pqs = parse(qs);
  return options?.types
    ? queryTypes.parseObject(pqs)
    : pqs;
}

function parseJson(input: any): Record<string, any> {
  try {
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

export interface JsonQueryParserConfig {
  filter?: string;
  sort?: string;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const intParamParser = (part: 'skip' | 'limit', param?: string) => {
  return (qs: ParsedQs) => (param || part) in qs
    ? ({[part]: parseInt(qs[param || part] as string)})
    : ({});
}

export const jsonParamParser = (part: 'filter' | 'sort' | 'projection', param?: string) => {
  return (qs: ParsedQs) => (param || part) in qs
    ? ({[part]: parseJson(qs[param || part])})
    : ({});
}

export const makeQuery = (qs: ParsedQs, parsers: PartialQueryParser[]) => {
  let query: Query = {};
  for (const p of parsers) {
    merge(query as any, p(qs));
  }
  return query;
}

export const jsonQueryParser = (config?: JsonQueryParserConfig | string) =>
  (qs: ParsedQs) => typeof config === 'string'
    ? parseJson(qs[config])
    : makeQuery(qs, [
      jsonParamParser('filter', config?.filter),
      jsonParamParser('sort', config?.sort),
      jsonParamParser('projection', config?.sort),
      intParamParser('skip', config?.skip),
      intParamParser('limit', config?.limit)
    ]);

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

export const multiParamFilterParser = (config: MultiParamFilterParserConfig) => (qs: ParsedQs) => {
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

  for (const [lhs, rhs] of Object.entries(qs)) {
    if (!config.exclude.includes(lhs)) {
      merge(filter, config.operator
        ? parseFilter(lhs, rhs?.toString() || '', config.operator)
        : ({[lhs]: rhs}));
    }
  }
  return {filter};
}

export interface NestedSortConfig {
  param: string;
  asc: string | string[];
  desc: string | string[];
}

const defaultNestedSortConfig: NestedSortConfig = {
  param: 'sort', asc: '1', desc: '-1',
}

export const nestedSort = (config?: NestedSortConfig) => {
  const {param, asc, desc} = Object.assign({}, defaultNestedSortConfig, config);

  return (qs: string) => {
    const match = (options: string | string[], value: string) =>
      (Array.isArray(options) ? options : [options]).includes(value);

    const pqs = parseQs(qs, {types: false});
    const sort: SortingMap = {};
    const value = pqs[param];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw Error('Failed to parse sort');
    }
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') {
        if (match(asc, v)) {
          sort[k] = 1;
        } else if (match(desc, v)) {
          sort[k] = -1;
        }
      }
    }
    return {sort};
  }
}

export const nestedFilter = () => (qs: string) => {
  return parseQs(qs, {types: true});
}

export interface SortParserConfig {
  param: string;
  asc: RegExp;
  desc: RegExp;
  delimiter: string;
}

const defaultSortParserConfig: SortParserConfig = {
  param: 'sort', asc: /^(?!-)(.+)/, desc: /\-(.*?)$/, delimiter: ','
}

export const singleParamSortParser = (config?: Partial<SortParserConfig>) => {
  const {param, asc, desc, delimiter} = Object.assign({}, config, defaultSortParserConfig);

  return (qs: ParsedQs) => {
    const sorting = (fields: string[]) => fields.reduce((sort, field) => {
      const ascMatch = asc.exec(field);
      const descMatch = desc.exec(field);
      if (ascMatch) {
        sort[ascMatch[1]] = 1;
      } else if (descMatch) {
        sort[descMatch[1]] = -1;
      }
      return sort;
    }, {} as SortingMap);

    const value = qs[param];

    return typeof value === 'string'
      ? ({sort: sorting(value.split(delimiter))})
      : ({});
  }
}

export const singleParamProjectionParser = (param: string = 'projection') => {
  return (qs: ParsedQs) => {
    const projection = (fields: string[]) => fields.reduce((p, field) => {
      p[field] = 1;
      return p;
    }, {} as Projection<any>)

    const value = qs[param];

    return typeof value === 'string'
      ? ({projection: projection(value.split(','))})
      : ({});
  }
}

export interface FlatQueryParserConfig {
  operator?: OperatorParserConfig;
  sort?: SortParserConfig;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const flatQueryParser = (config?: FlatQueryParserConfig) => (qs: ParsedQs) =>
  makeQuery(qs, [
    multiParamFilterParser({
      operator: config?.operator,
      exclude: [
        config?.sort?.param || 'sort',
        config?.skip || 'skip',
        config?.limit || 'limit',
        config?.projection || 'projection',
      ]
    }),
    singleParamSortParser(config?.sort),
    singleParamProjectionParser(config?.projection),
    intParamParser('skip', config?.skip),
    intParamParser('limit', config?.limit),
  ]);
