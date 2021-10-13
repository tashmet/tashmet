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
  param: string | ((include: boolean) => string);

  /**
   * Function that serializes an included field
   *
   * Field inclusion can also be disabled in serialized output by setting this
   * to false.
   *
   * @default field => field
   */
  include: FieldSerializer;

  /**
   * Function that serializes an excluded field
   *
   * Field exclusion can also be disabled in serialized output by setting this
   * to false.
   *
   * @default field => `-${field}`
   */
  exclude: FieldSerializer;

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

  return singleParam(q => {
    const {_id, ...projection} = q.projection || {};
    const isInclusion = Object.values(projection).some(v => v)
    const fields = Object.entries(projection)
      .filter(([k, v]) => v !== undefined && !!v === isInclusion)
      .map(([k, v]) => k);

    return fields.length !== 0
      ? new Param(
        typeof param === 'string' ? param : param(isInclusion),
        fields.map(isInclusion ? include : exclude).join(separator))
      : null;
  });
}

export interface NestedProjectionConfig {
  param: string;
  value: (v: boolean | 1 | 0) => string | number | boolean;
}

const defaultNestedProjectionConfig: NestedProjectionConfig = {
  param: 'projection', value: v => +v
}

export const nestedProjection = (config?: Partial<NestedProjectionConfig>) => {
  const {param, value} = Object.assign({}, defaultNestedProjectionConfig, config);
  return (q: Query) => qsStringify({[param]: Object.entries(q.projection || {})
    .reduce((p, [k, v]) => {
      if (v !== undefined) {
        p[k] = value(v);
      }
      return p;
    }, {} as any)});
}
