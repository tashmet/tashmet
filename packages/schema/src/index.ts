import Ajv, { Schema } from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator, ValidationError } from "@tashmet/engine";

export class AjvJsonSchemaOperators {
  @op.query('$jsonSchema')
  $jsonSchema(selector: string, schema: Schema, ctx: OperatorContext) {
    const ajv = new Ajv();
    const v = ajv.compile(schema);

    return (obj: any) => {
      const passed = v(obj) ? true : false;

      if (!passed && ctx.options.variables?.$validator) {
        throw new ValidationError({
          failingDocumentId: (obj as any)._id,
          details: {}
        });
      }

      return passed;
    }
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(AjvJsonSchemaOperators, container);
