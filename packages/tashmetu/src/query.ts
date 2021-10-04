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

export interface MultiParamFilterParserConfig {
  exclude: string[];
}

export const multiParamFilterParser = (config: MultiParamFilterParserConfig) => (req: express.Request) => {
  let filter: Filter<any> = {};

  const parseFilter = (lhs: string, rhs: string) => {
    if (lhs.indexOf(':') !== -1) {
      const [field, op] = lhs.split(':');
      return ({[field]: {[`$${op}`]: rhs}});
    } else {
      return ({[lhs]: rhs});
    }
  }

  for (const [lhs, rhs] of Object.entries(req.query)) {
    if (!config.exclude.includes(lhs)) {
      merge(filter, parseFilter(lhs, rhs?.toString() || ''));
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
  sort?: string;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const flatQueryParser = (config?: FlatQueryParserConfig) => (req: express.Request) =>
  makeQuery(req, [
    multiParamFilterParser({
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
