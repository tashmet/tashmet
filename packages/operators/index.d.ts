import {OperatorMap} from "mingo/core";

export interface OperatorConfig {
  accumulator?: OperatorMap;
  expression?: OperatorMap;
  pipeline?: OperatorMap;
  projection?: OperatorMap;
  query?: OperatorMap;
}
