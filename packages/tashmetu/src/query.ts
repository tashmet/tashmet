import {Filter, Query, SortingMap, Projection} from '@ziqquratu/ziqquratu';
import * as express from 'express';
import {merge} from 'mingo/util';

export type QueryParser = (req: express.Request) => Query;
export type PartialQueryParser = (req: express.Request) => Partial<Query>

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
  return (req: express.Request) => (param || part) in req.query
    ? ({[part]: parseInt(req.query[param || part] as string)})
    : ({});
}

export const jsonParamParser = (part: 'filter' | 'sort' | 'projection', param?: string) => {
  return (req: express.Request) => (param || part) in req.query
    ? ({[part]: parseJson(req.query[param || part])})
    : ({});
}

export const makeQuery = (req: express.Request, parsers: PartialQueryParser[]) => {
  let query: Query = {};
  for (const p of parsers) {
    merge(query as any, p(req));
  }
  return query;
}

export const jsonQueryParser = (config?: JsonQueryParserConfig) => (req: express.Request) => {
  return makeQuery(req, [
    jsonParamParser('filter', config?.filter),
    jsonParamParser('sort', config?.sort),
    jsonParamParser('projection', config?.sort),
    intParamParser('skip', config?.skip),
    intParamParser('limit', config?.limit)
  ]);
}

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

export const multiParamFilterParser = (config: MultiParamFilterParserConfig) => (req: express.Request) => {
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

  for (const [lhs, rhs] of Object.entries(req.query)) {
    if (!config.exclude.includes(lhs)) {
      merge(filter, config.operator
        ? parseFilter(lhs, rhs?.toString() || '', config.operator)
        : ({[lhs]: rhs}));
    }
  }
  return {filter};
}

export const singleParamSortParser = (param: string = 'sort') => {
  return (req: express.Request) => {
    const sorting = (fields: string[]) => fields.reduce((sort, field) => {
      const sign = field.substr(0, 1);
      if (sign === '-') {
        sort[field.substr(1)] = -1;
      } else {
        sort[field] = 1;
      }
      return sort;
    }, {} as SortingMap);

    const value = req.query[param];

    return value
      ? ({sort: sorting(value.toString().split(','))})
      : ({});
  }
}

export const singleParamProjectionParser = (param: string = 'projection') => {
  return (req: express.Request) => {
    const projection = (fields: string[]) => fields.reduce((p, field) => {
      p[field] = 1;
      return p;
    }, {} as Projection<any>)

    const value = req.query[param];

    return value
      ? ({projection: projection(value.toString().split(','))})
      : ({});
  }
}

export interface FlatQueryParserConfig {
  operator?: OperatorParserConfig;
  sort?: string;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const flatQueryParser = (config?: FlatQueryParserConfig) => (req: express.Request) =>
  makeQuery(req, [
    multiParamFilterParser({
      operator: config?.operator,
      exclude: [
        config?.sort || 'sort',
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
