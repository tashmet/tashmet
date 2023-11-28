import { Document } from '@tashmet/tashmet';
import { Container, provider } from '@tashmet/core';
import { ValidatorFactory, AggregatorFactory } from '@tashmet/engine';
import { op, OperatorPluginConfigurator, ValidationError } from '@tashmet/engine';
import { getType } from 'mingo/util';
import { MingoOperatorContext } from './operator.js';
import * as queryOperators from "mingo/operators/query";


@provider({
  key: ValidatorFactory,
})
export class MingoValidatorFactory extends ValidatorFactory {
  constructor(
    private aggregatorFactory: AggregatorFactory,
  ) { super(); }

  createValidator(rules: Document) {
    const aggregator = this.aggregatorFactory.createAggregator([
      { $match: rules },
    ], {
      variables: {
        $validator: true
      }
    });

    return async (doc: Document) => {
      const results = await aggregator.run<Document>([doc]);
      return results[0];
    }
  }
}


class MingoValidationQueryOperators {
  @op.query('$type')
  $type(selector: string, value: any, ctx: MingoOperatorContext) {
    const mingoOp = (queryOperators as any)[ctx.op];
    const call = mingoOp(selector, value, ctx.options);

    return (obj: any) => {
      const result = call(obj);

      if (!result && ctx.options.variables?.$validator) {
        const consideredValue = ctx.resolve(obj, selector);

        throw new ValidationError({
          failingDocumentId: obj._id,
          details: {
            operatorName: '$type',
            specifiedAs: value,
            reason: 'type did not match',
            consideredValue,
            consideredType: getType(consideredValue),
          }
        });
      }
      return result;
    }
  }
}

export const validationOperators = () => (container: Container) =>
  new OperatorPluginConfigurator(MingoValidationQueryOperators, container);
