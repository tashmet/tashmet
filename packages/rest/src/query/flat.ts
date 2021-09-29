import {HttpQueryBuilder, limitParam, skipParam} from "../query";
import {multiParamFilter, MultiParamFilterConfig, lhsColon } from './filter';
import {singleParamSort, SingleParamSortConfig} from './sort';

export interface FlatQueryConfig {
  filter?: MultiParamFilterConfig;
  sort?: SingleParamSortConfig;
  skip?: string;
  limit?: string;
}

export const flatQuery = (config?: FlatQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    multiParamFilter(config?.filter || {format: lhsColon}),
    singleParamSort(config?.sort),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ], p => p.value === undefined);
