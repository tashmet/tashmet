import {Query, QueryOptions} from '@ziqquratu/database';
import {Param, QueryConverter, QueryParamFactory} from './interfaces';

export type QuerySerializer = (query: Query) => string[];
export type CopyQuery = (target?: string) => QuerySerializer;

export function singleParam(toParam: QueryConverter<Param | null>) {
  return (q: Query) => {
    const p = toParam(q);
    return p ? [p] : [];
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
    private exclude: (p: Param) => boolean,
  ) {}

  public serialize(filter: object = {}, options: QueryOptions = {}) {
    const q = {filter, ...options};
    const params = this.paramFactories
      .reduce((params, fact) => params.concat(fact(q)), [] as Param[])
      .filter(p => !this.exclude(p))

    return params.length > 0
      ? this.path + '?' + params.map(p => p.toString()).join('&')
      : this.path;
  }
}
