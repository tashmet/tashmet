import {Param} from '../interfaces';
import {singleParam} from "../query";

export interface DelimitedProjectionConfig {
  param: string;
  separator: string;
}

const defaultConfig: DelimitedProjectionConfig = {
  param: 'projection', separator: ',',
}

/**
 * Parameter factory that creates a projection parameter
 *
 * Given a projection map:
 * ```typescript
 * {
 *   foo: 1,
 *   bar: 1,
 * }
 * ```
 *
 * A parameter will be produced on the following format
 * ```typescript
 * 'projection=foo,bar'
 * ```
 *
 * @param config Configuration options
 * @returns A parameter factory
 */
export const delimitedProjection = (config?: Partial<DelimitedProjectionConfig>) => {
  const {param, separator} = Object.assign({}, defaultConfig, config);

  return singleParam(q => new Param(param, Object.entries(q.projection || {})
    .filter(([k, v ]) => v === 1)
    .map(([k, v]) => k)
    .join(separator))
  );
}
