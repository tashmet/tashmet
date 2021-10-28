import {Query} from "@tashmit/database";

export class Param {
  public constructor(
    public name: string,
    public value?: string | number | boolean
  ) {}

  public toString() {
    return this.value !== undefined && this.value !== ''
      ? `${this.name}=${this.value}`
      : '';
  }
}

export type OperatorFormat = (key: string, value: any, op: string) => Param;
export type OperatorMap = Record<string, string | OperatorFormat>

export interface FlatFilterConfig {
  alias?: (op: string) => string;
  format: OperatorFormat;
}

export interface NestedFilterConfig {
  root: string | false;
}

export interface DelimitedSortConfig {
  param: string;
  asc: (key: string) => string;
  desc: (key: string) => string;
  separator: string;
}

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

export interface NestedProjectionConfig {
  param: string;
  value: (v: boolean | 1 | 0) => string | number | boolean;
}

export interface JsonQueryConfig {
  /**
   * Name of the filter param
   * @default 'filter'
   */
  filter?: string;

  /**
   * Name of the sort param
   * @default 'sort'
   */
  sort?: string;

  /**
   * Name of the projection param
   * @default 'projection'
   */
  projection?: string;

  /**
   * Name of the skip param
   * @default 'skip'
   */
  skip?: string;

  /**
   * Name of the limit param
   * @default 'limit'
   */
  limit?: string;
}

export interface FlatQueryConfig {
  filter?: FlatFilterConfig;
  sort?: DelimitedSortConfig;
  projection?: DelimitedProjectionConfig;
  skip?: string;
  limit?: string;
}

export interface NestedQueryConfig {
  filter?: NestedFilterConfig;
  sort?: string;
  projection?: NestedProjectionConfig;
  skip?: string;
  limit?: string;
}
