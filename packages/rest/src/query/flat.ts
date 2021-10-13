import {HttpQueryBuilder, limitParam, skipParam} from "../query";
import {multiParamFilter, MultiParamFilterConfig, lhsColon } from './filter';
import {delimitedSort, DelimitedSortConfig} from './sort';

export interface FlatQueryConfig {
  filter?: MultiParamFilterConfig;
  sort?: DelimitedSortConfig;
  skip?: string;
  limit?: string;
}

export const flatQuery = (config?: FlatQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    multiParamFilter(config?.filter || {format: lhsColon}),
    delimitedSort(config?.sort),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ]);
