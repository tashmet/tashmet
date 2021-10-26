
export interface NestedSortConfig {
  param: string;
  asc: string | string[];
  desc: string | string[];
}

export interface DelimitedSortConfig {
  param: string;
  asc: RegExp;
  desc: RegExp;
  delimiter: string;
}

export interface OperatorParserConfig {
  pattern: RegExp;
  rhs: boolean;
}

export interface FlatFilterConfig {
  exclude: string[];
  operator?: OperatorParserConfig;
}

export const rhsColon: OperatorParserConfig = {
  pattern: /(.*)\:(.*)/,
  rhs: true,
}

export const lhsColon: OperatorParserConfig = {
  pattern: /(.*)\:(.*)/,
  rhs: false,
}

export interface OperatorParserConfig {
  pattern: RegExp;
  rhs: boolean;
}

export interface FlatFilterConfig {
  exclude: string[];
  operator?: OperatorParserConfig;
}

export interface NestedFilterConfig {
  param: string;
  types: boolean;
}
