import {Query, QueryOptions} from '@tashmit/database';
import {Param, QueryConverter, QueryParamFactory} from './interfaces';

export type QuerySerializer = (query: Query) => string[];
export type CopyQuery = (target?: string) => QuerySerializer;

export function singleParam(toParam: QueryConverter<Param | null>) {
  return (q: Query) => {
    const p = toParam(q);
    return p ? p.toString() : '';
  }
}

export const skipParam = (name: string = 'skip') =>
  singleParam(q => new Param(name, q.skip));

export const limitParam = (name: string = 'limit') =>
  singleParam(q => new Param(name, q.limit));

export class HttpQueryBuilder {
  public constructor(
    private path: string,
    private paramFactories: QueryParamFactory[],
  ) {}

  public serialize(filter: object = {}, options: QueryOptions = {}) {
    const query = {filter, ...options};
    const params = this.paramFactories
      .map(fact => fact(query))
      .filter(v => v !== '')
      .join('&');

    return params.length > 0
      ? this.path + '?' + params
      : this.path;
  }
}
