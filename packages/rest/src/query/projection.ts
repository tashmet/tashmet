import {Query} from '@ziqquratu/database';
import {Param} from '../interfaces';
import {singleParam} from '../query';

const qsStringify = require('qs-stringify');

type FieldSerializer = (field: string) => string;

export interface DelimitedProjectionConfig {
  /**
   * Name of parameter
   *
   * @default 'projection'
   */
  param: string;

  /**
   * Function that serializes an included field
   *
   * Field inclusion can also be disabled in serialized output by setting this
   * to false.
   *
   * @default field => field
   */
  include: FieldSerializer | false;

  /**
   * Function that serializes an excluded field
   *
   * Field exclusion can also be disabled in serialized output by setting this
   * to false.
   *
   * @default field => `-${field}`
   */
  exclude: FieldSerializer | false;

  /**
   * Field separator
   *
   * @default ','
   */
  separator: string;
}

const defaultConfig: DelimitedProjectionConfig = {
  param: 'projection', include: f => f, exclude: f => `-${f}`, separator: ',',
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
  const {param, include, exclude, separator} = Object.assign({}, defaultConfig, config);

  const included = (v: 0 | 1 | boolean | undefined) => v === 1 || v === true;
  const excluded = (v: 0 | 1 | boolean | undefined) => v === 0 || v === false;

  return singleParam(q => {
    const value = Object.entries(q.projection || {})
      .map(([k, v]) => {
        return include && included(v)
          ? include(k)
          : exclude && excluded(v) ? exclude(k) : false;
      })
      .filter(v => v)
      .join(separator);
    return value !== '' ? new Param(param, value) : null;
  });
}

export const nestedProjection = (param: string = 'projection') => (q: Query) =>
  qsStringify({[param]: q.projection});
