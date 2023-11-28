import Ajv, { ErrorObject } from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator, ValidationError } from "@tashmet/engine";
import { Document } from "@tashmet/tashmet";

export class AjvJsonSchemaOperators {
  @op.query('$jsonSchema')
  $jsonSchema(selector: string, schema: Document, ctx: OperatorContext) {
    const ajv = new Ajv();
    const v = ajv.compile(schema);

    return (obj: any) => {
      const passed = v(obj) ? true : false;

      if (!passed && ctx.options.variables?.$validator) {
        function formatMinimum(err: ErrorObject) {
          const selector = err.instancePath.substring(1).split('/').join('.');

          return {
            operatorName: 'minimum',
            specifiedAs: err.params.limit,
            reason: err.message,
            consideredValue: ctx.resolve(obj, selector),
          }
        }

        function formatPropertyError(err: ErrorObject, propertyName: string, property: Document) {
          return {
            propertyName,
            description: property.description,
            details: formatMinimum(err),
          }
        }

        function formatError(err: ErrorObject) {
          const parts = err.schemaPath.substring(2).split('/')
          const operatorName = parts[0];

          const selector = parts.slice(0, -1).join('.');
          const property = ctx.resolve(schema, selector);

          return {
            operatorName,
            propertiesNotSatisfied: [
              formatPropertyError(err, parts[1], property)
            ]
          }
        }

        const details = {
          operatorName: '$jsonSchema',
          title: schema.title,
          schemaRulesNotSatisfied: (v.errors || []).map(err => formatError(err)),
        };

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
