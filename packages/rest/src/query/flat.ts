import {HttpQueryBuilder, limitParam, skipParam} from "../query";
import {flatFilter, FlatFilterConfig, lhsColon } from './filter';
import {flatSort, FlatSortConfig} from './sort';

export interface FlatQueryConfig {
  filter?: FlatFilterConfig;
  sort?: FlatSortConfig;
  skip?: string;
  limit?: string;
}

export const flatQuery = (config?: FlatQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    flatFilter(config?.filter || {format: lhsColon}),
    flatSort(config?.sort),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ], p => p.value === undefined);
