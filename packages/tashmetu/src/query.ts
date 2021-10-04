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

export const multiParamFilterParser = () => (req: express.Request) => {
  const exclude = ['sort', 'skip', 'limit', 'projection'];
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
    if (!exclude.includes(lhs)) {
      merge(filter, parseFilter(lhs, rhs?.toString() || ''));
    }
  }
  return {filter};
}

export const singleParamSortParser = () => (req: express.Request) => {
  const param = 'sort';
  let sort: SortingMap = {};
  const value = req.query[param];

  if (value) {
    for (const s of value.toString().split(',')) {
      const sign = s.substr(0, 1);
      if (sign === '-') {
        sort[s.substr(1)] = -1;
      } else {
        sort[s] = 1;
      }
    }
    return {sort};
  }
  return {};
}

export const singleParamProjectionParser = () => (req: express.Request) => {
  const param = 'projection';
  let projection: Projection<any> = {};
  const value = req.query[param];

  if (value) {
    for (const field of value.toString().split(',')) {
      projection[field] = 1;
    }
    return {projection};
  }
  return {};
}

export const flatQueryParser = () => (req: express.Request) =>
  makeQuery(req, [
    multiParamFilterParser(),
    singleParamSortParser(),
    singleParamProjectionParser(),
    intParamParser('skip'),
    intParamParser('limit'),
  ]);
