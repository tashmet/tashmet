import {nestedFilter, NestedFilterConfig} from "./filter";
import {nestedSort} from "./sort";
import {nestedProjection, NestedProjectionConfig} from "./projection";
import {HttpQueryBuilder, limitParam, skipParam} from "../query";

export interface NestedQueryConfig {
  filter?: NestedFilterConfig;
  sort?: string;
  projection?: NestedProjectionConfig;
  skip?: string;
  limit?: string;
}

export const nestedQuery = (config?: NestedQueryConfig) => (path: string) =>
  new HttpQueryBuilder(path, [
    nestedFilter(config?.filter),
    nestedSort(config?.sort),
    nestedProjection(config?.projection),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ]);
