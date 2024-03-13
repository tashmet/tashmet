import { ExpressionIO } from "./expression.js";

export class JsonExpressionIO implements ExpressionIO {
  reader(expr: any) { return { $jsonToObject: expr } };
  writer(expr: any) { return { $objectToJson: expr } };
}
