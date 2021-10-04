import {Query} from '@ziqquratu/ziqquratu';
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