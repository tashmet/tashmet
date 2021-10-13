import {HttpQueryBuilder, limitParam, skipParam} from "../query";
import {flatFilter, FlatFilterConfig, lhsColon } from './filter';
import {delimitedProjection, DelimitedProjectionConfig} from "./projection";
import {delimitedSort, DelimitedSortConfig} from './sort';

export interface FlatQueryConfig {
  filter?: FlatFilterConfig;
  sort?: DelimitedSortConfig;
  projection?: DelimitedProjectionConfig;
  skip?: string;
  limit?: string;
}

export const flatQuery = (config?: FlatQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    flatFilter(config?.filter || {format: lhsColon}),
    delimitedSort(config?.sort),
    delimitedProjection(config?.projection),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ]);
