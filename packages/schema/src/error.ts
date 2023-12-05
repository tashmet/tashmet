import { ErrorObject } from "ajv"
import { OperatorContext } from "@tashmet/engine";
import { Document } from "@tashmet/tashmet";

interface SchemaDefinition {
  name: string;

  value: any;

  instance: any;

  instancePath: string;

  params: any;
}

export function mergeError(target: Document[], err: Document) {
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

function makeProperty(sequence: SchemaDefinition[], depth: number) {
  const def = sequence[depth];
  const propertyName = def.name;
  const description = def.value.description;
  const result: Document = {
    propertyName,
    details: [
      makeOperator(sequence, depth + 1)
    ],
  }

  if (description) {
    result.description = description;
  }

  return result;
}

function makeComparison(operatorName: string, def: SchemaDefinition, reason: string = 'comparison failed') {
  return {
    operatorName,
    specifiedAs: { [operatorName]: def.value },
    reason,
    consideredValue: def.instance,
  };
}

function makeArrayLengthComparison(operatorName: string, def: SchemaDefinition) {
  return {
    operatorName,
    specifiedAs: { [operatorName]: def.value },
    reason: 'array did not match specified length',
    consideredValue: def.instance,
    numberOfItems: def.instance.length,
  }
}

function makeOperator(sequence: SchemaDefinition[], depth: number): Document {
  const def = sequence[depth];
  const operatorName = def.name;

  switch (operatorName) {
    case 'properties':
      return {
        operatorName,
        propertiesNotSatisfied: [
          makeProperty(sequence, depth + 1)
        ]
      };
    case 'required':
      return {
        operatorName,
        specifiedAs: { required: def.value },
        missingProperties: [def.params.missingProperty],
      };
    case 'type':
      return {
        operatorName,
        specifiedAs: { type: def.value },
        reason: 'type did not match',
        consideredValue: def.instance,
        consideredType: typeof def.instance,
      };
    case 'items':
      const instancePath = def.instancePath.split('.');
      return {
        operatorName,
        reason: 'At least one item did not match the sub-schema',
        itemIndex: parseInt(instancePath[instancePath.length - 1]),
        details: [
          makeOperator(sequence, depth + 1)
        ]
      };
    case 'minLength':
    case 'maxLength':
      return makeComparison(operatorName, def, 'specified string length was not satisfied');
    case 'minimum':
    case 'maximum':
    case 'exclusiveMinimum':
    case 'exclusiveMaximum':
      return makeComparison(operatorName, def);
    case 'minItems':
    case 'maxItems':
      return makeArrayLengthComparison(operatorName, def);
    case 'uniqueItems':
      return {
        operatorName,
        specifiedAs: { [operatorName]: def.value },
        reason: 'found a duplicate item',
        consideredValue: def.instance,
        duplicateValue: def.instance[def.params.i]
      }
    default:
      return {};
  }
}

export function makeError(err: ErrorObject, doc: Document, schema: Document, ctx: OperatorContext) {
  const instancePath = err.instancePath.substring(1).split('/').join('.');
  const instance = ctx.resolve(doc, instancePath);
  const schemaPathItems = err.schemaPath.substring(2).split('/');

  const sequence = schemaPathItems.map((item, index) => {
    return {
      name: item,
      value: ctx.resolve(schema, schemaPathItems.slice(0, index + 1).join('.')),
      instance,
      instancePath,
      params: err.params,
    }
  });

  return makeOperator(sequence, 0);
}
