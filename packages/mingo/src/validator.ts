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
  
  /** $type operator with validation error support */
  @op.query('$type')
  $type(selector: string, value: any, ctx: MingoOperatorContext) {
    return this.validationOp(queryOperators.$type(selector, value, ctx.options), ctx, obj => {
      const consideredValue = ctx.resolve(obj, selector);
      return {
        operatorName: '$type',
        specifiedAs: value,
        reason: 'type did not match',
        consideredValue,
        consideredType: getType(consideredValue),
      }
    });
  }

  /** $expr operator with validation error support */
  @op.query('$expr')
  $expr(selector: string, value: any, ctx: MingoOperatorContext) {
    return this.validationOp(queryOperators.$expr(selector, value, ctx.options), ctx, obj => {
      return {
        operatorName: '$expr',
        specifiedAs: { $expr: value },
        reason: 'expression did not match',
        expressionResult: false,
      }
    });
  }

  private validationOp(
    call: (obj: any) => boolean,
    ctx: MingoOperatorContext,
    getDetails: (obj: any) => Document
  ) {
    return (obj: any) => {
      const result = call(obj);
      if (!result && ctx.options.variables?.$validator) {
        throw new ValidationError({
          failingDocumentId: obj._id,
          details: getDetails(obj)
        });
      }
      return result;
    }
  }
}

export const validationOperators = () => (container: Container) =>
  new OperatorPluginConfigurator(MingoValidationQueryOperators, container);
