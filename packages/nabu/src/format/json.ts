import { ExpressionIO } from "./common.js";

export class JsonExpressionIO implements ExpressionIO {
  reader(expr: any) { return { $jsonToObject: expr } };
  writer(expr: any) { return { $objectToJson: expr } };
}
