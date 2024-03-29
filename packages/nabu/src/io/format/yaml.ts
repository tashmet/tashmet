import { ExpressionIO } from "./expression.js";

export class YamlExpressionIO implements ExpressionIO {
  reader(expr: any) { return { $yamlToObject: expr } };
  writer(expr: any) { return { $objectToYaml: expr } };
}
