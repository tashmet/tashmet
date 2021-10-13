/*import {HttpQueryBuilder, limitParam, skipParam} from "../query";
import {multiParamFilter, MultiParamFilterConfig, lhsColon } from './filter';
import {singleParamSort, SingleParamSortConfig} from './sort';

export const nestedQuery = () => (path: string) =>
  new HttpQueryBuilder(path, [
    multiParamFilter(config?.filter || {format: lhsColon}),
    singleParamSort(config?.sort),
    skipParam(config?.skip),
    limitParam(config?.skip),
  ], p => p.value === undefined);
*/