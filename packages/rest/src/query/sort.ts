import {SortingDirection} from '@ziqquratu/database';
import {Param} from '../interfaces';
import {singleParam} from "../query";

export interface FlatSortConfig {
  param: string;
  asc: (key: string) => string;
  desc: (key: string) => string;
  separator: string;
}

const defaultFlatSortConfig: FlatSortConfig = {
  param: 'sort', asc: k => `+${k}`, desc: k => `-${k}`, separator: ',',
}

/**
 * Parameter factory that creates a sort parameter
 *
 * Given a sorting map:
 * ```typescript
 * {
 *   foo: SortingDirection.Ascending
 *   bar: SortingDirection.Descending
 * }
 * ```
 *
 * A parameter will be produced on the following format
 * ```typescript
 * 'sort=+foo,-bar'
 * ```
 *
 * @param config Configuration options
 * @returns A parameter factory
 */
export const flatSort = (config?: Partial<FlatSortConfig>) => {
  const {param, asc, desc, separator} = Object.assign(
    {}, defaultFlatSortConfig, config);

  return singleParam(q =>
    new Param(param, Object.entries(q.sort || {})
      .filter(([k, v ]) => v !== undefined)
      .map(([k, v]) => v === SortingDirection.Ascending ? asc(k) : desc(k))
      .join(separator))

  );
}
