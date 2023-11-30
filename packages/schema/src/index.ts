import Ajv, { ErrorObject } from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator, ValidationError } from "@tashmet/engine";
import { Document } from "@tashmet/tashmet";

export class AjvJsonSchemaOperators {
  @op.query('$jsonSchema')
  $jsonSchema(selector: string, schema: Document, ctx: OperatorContext) {
    const ajv = new Ajv({ allErrors: true });
    const v = ajv.compile(schema);

    return (obj: any) => {
      const passed = v(obj) ? true : false;

      if (!passed && ctx.options.variables?.$validator) {
        function formatSpecifiedAs(err: ErrorObject) {
          switch (err.keyword) {
            case 'minimum':
            case 'maximum':
              return err.params.limit;
            case 'type':
              return err.params.type;
          }
        }

        function formatPropertyError(err: ErrorObject, propertyName: string, property: Document) {
          const selector = err.instancePath.substring(1).split('/').join('.');

          return {
            propertyName,
            description: property.description,
            details: {
              operatorName: err.keyword,
              specifiedAs: formatSpecifiedAs(err),
              reason: err.message,
              consideredValue: ctx.resolve(obj, selector),
            }
          }
        }

        function formatObjectErrors(errors: ErrorObject[]) {
          const output: Document[] = [];
          const propertyErrors = errors
            .filter(e => e.schemaPath.startsWith('#/properties'));
          const requiredErrors = errors
            .filter(e => e.schemaPath.startsWith('#/required'));

          if (propertyErrors.length > 0) {
            output.push({
              operatorName: 'properties',
              propertiesNotSatisfied: propertyErrors.map(err => {
                const parts = err.schemaPath.substring(2).split('/');
                const selector = parts.slice(0, -1).join('.');
                const property = ctx.resolve(schema, selector);

                return formatPropertyError(err, parts[1], property);
              })
            });
          }

          if (requiredErrors.length > 0) {
            const missingProperties = requiredErrors.map(err => err.params.missingProperty);

            output.push({
              operatorName: 'required',
              specifiedAs: { required: ctx.resolve(schema, 'required') },
              missingProperties: missingProperties,
            });
          }

          return output;
        }

        const details = {
          operatorName: '$jsonSchema',
          title: schema.title,
          schemaRulesNotSatisfied: formatObjectErrors(v.errors || []),
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
