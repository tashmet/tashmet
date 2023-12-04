import Ajv, { ErrorObject } from "ajv"
import { Container } from "@tashmet/core";
import { op, OperatorContext, OperatorPluginConfigurator, ValidationError } from "@tashmet/engine";
import { Document } from "@tashmet/tashmet";

function mergeError(target: Document[], err: Document) {
  const op = target.find(rule => rule.operatorName === err.operatorName);

  if (!op) {
    target.push(err);
  } else {
    switch (err.operatorName) {
      case 'required':
        mergeRequired(op, err);
        break;
      case 'properties':
        mergeProperties(op, err);
        break;
    }
  }

  return target;
}

function mergeRequired(a: Document, b: Document) {
  a.missingProperties.push(...b.missingProperties);
}

function mergeProperties(a: Document, b: Document) {
  a.propertiesNotSatisfied.push(...b.propertiesNotSatisfied);
}

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
            mergeError(details.schemaRulesNotSatisfied, err.tree);
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

abstract class PropertyError {
  constructor(
    protected instancePath: string,
    public readonly description: string,
  ) {}

  get tree() {
    return this.atDepth(0);
  }

  abstract details: Document;

  private atDepth(depth: number) {
    const properties = this.instancePath.split('.');
    const isLeaf = depth == properties.length - 1;
    const propertyName = properties[depth];

    const makeProperty: () => Document = () => {
      if (isLeaf) {
        return {
          propertyName,
          description: this.description,
          details: [this.details],
        };
      } else {
        return {
          propertyName,
          details: [this.atDepth(depth + 1)],
        };
      }
    }

    return {
      operatorName: 'properties',
      propertiesNotSatisfied: [makeProperty()]
    }
  }
}

class SchemaTypeError extends PropertyError {
  constructor(
    instancePath: string,
    public readonly schemaDefinition: Document,
    public readonly consideredValue: any
  ) {
    super(instancePath, schemaDefinition.description);
  }

  get details(): Document {
    return {
      operatorName: 'type',
      specifiedAs: { type: this.schemaDefinition.type },
      reason: 'type did not match',
      consideredValue: this.consideredValue,
      consideredType: typeof this.consideredValue,
    }
  }
}

class SchemaComparisonError extends PropertyError {
  constructor(
    public readonly operatorName: string,
    instancePath: string,
    public readonly schemaDefinition: Document,
    public readonly consideredValue: number
  ) {
    super(instancePath, schemaDefinition.description);
  }

  get details(): Document {
    const operatorName = this.operatorName;

    return {
      operatorName,
      specifiedAs: { [operatorName]: this.schemaDefinition[operatorName] },
      reason: 'comparison failed',
      consideredValue: this.consideredValue,
    }
  }
}

class SchemaRequiredError {
  constructor(
    private instancePath: string,
    public readonly schemaDefinition: Document,
    public readonly missingProperty: string,
  ) {
  }

  get tree(): Document {
    return {
      operatorName: 'required',
      specifiedAs: { required: this.schemaDefinition.required },
      missingProperties: [ this.missingProperty ]
    }
  }
}


function makeError(err: ErrorObject, doc: Document, schema: Document, ctx: OperatorContext) {
  const instancePath = err.instancePath.substring(1).split('/').join('.');
  const instance = ctx.resolve(doc, instancePath);
  const schemaPathItems = err.schemaPath.substring(2).split('/');
  const schemaPath = schemaPathItems.slice(0, schemaPathItems.length - 1).join('.');
  const schemaDefinition = schemaPath !== '' ? ctx.resolve(schema, schemaPath) : schema;

  switch (err.keyword) {
    case 'type':
      return new SchemaTypeError(instancePath, schemaDefinition, instance);
    case 'minimum':
    case 'maximum':
      return new SchemaComparisonError(err.keyword, instancePath, schemaDefinition, instance);
    case 'required':
      return new SchemaRequiredError(instancePath, schemaDefinition, err.params.missingProperty);
  }
  throw Error('unknown error type: ' + err.keyword);
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(AjvJsonSchemaOperators, container);
