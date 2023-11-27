import Ajv, { Schema } from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator } from "@tashmet/engine";

export class AjvJsonSchemaOperators {
  @op.query('$jsonSchema')
  $jsonSchema(selector: string, schema: Schema, ctx: OperatorContext) {
    const ajv = new Ajv();
    const v = ajv.compile(schema);

    return (obj: any) => v(obj) ? true : false
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(AjvJsonSchemaOperators, container);
