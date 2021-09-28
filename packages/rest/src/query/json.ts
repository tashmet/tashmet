import {Param, Query} from "../interfaces";
import {HttpQueryBuilder, skipParam, limitParam, singleParam} from "../query";

export interface JsonQueryConfig {
  /**
   * Name of the filter param
   * @default 'filter'
   */
  filter?: string;

  /**
   * Name of the sort param
   * @default 'sort'
   */
  sort?: string;

  /**
   * Name of the skip param
   * @default 'skip'
   */
  skip?: string;

  /**
   * Name of the limit param
   * @default 'limit'
   */
  limit?: string;
}


export const jsonParam = (name: string, data: (q: Query) => object | undefined) =>
  singleParam(q => new Param(name, JSON.stringify(data(q))));


export const jsonQuery = (config?: JsonQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    jsonParam(config?.filter || 'filter', q => q.filter),
    jsonParam(config?.sort || 'sort', q => q.sort),
    skipParam(config?.skip),
    limitParam(config?.limit),
  ],
    p => !p.value || p.value === '{}'
  );
