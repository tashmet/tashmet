import Ajv from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator, ValidationError } from "@tashmet/engine";
import { Document } from "@tashmet/tashmet";
import { makeError, mergeError } from "./error.js";

export class AjvJsonSchemaOperators {
  @op.query('$jsonSchema')
  $jsonSchema(selector: string, schema: Document, ctx: OperatorContext) {
    const ajv = new Ajv({ allErrors: true });
    const v = ajv.compile(schema);

    return (obj: any) => {
      const passed = v(obj) ? true : false;

      if (!passed && ctx.options.variables?.$validator) {
        const details: Document = {
          operatorName: '$jsonSchema',
          title: schema.title,
          schemaRulesNotSatisfied: [],
        };

        if (v.errors && v.errors.length > 0) {
          const errors = v.errors.map(err => makeError(err, obj as Document, schema, ctx));
        
          for (const err of errors) {
            mergeError(details.schemaRulesNotSatisfied, err);
          }
        }

        throw new ValidationError({
          failingDocumentId: (obj as any)._id,
          details,
        });
      }

      return passed;
    }
  }
}


export default () => (container: Container) =>
  new OperatorPluginConfigurator(AjvJsonSchemaOperators, container);
