import { Document } from '@tashmet/tashmet';
import { provider } from '@tashmet/core';
import { ValidatorFactory, AggregatorFactory } from '@tashmet/engine';

@provider({
  key: ValidatorFactory,
})
export class MingoValidatorFactory extends ValidatorFactory {
  constructor(
    private aggregatorFactory: AggregatorFactory,
  ) { super(); }

  createValidator(rules: Document) {
    const aggregator = this.aggregatorFactory.createAggregator([
      { $match: rules }
    ]);

    return async (doc: Document) => {
      const results = await aggregator.run<Document>([doc]);

      if (results.length > 0) {
        return results[0];
      } else {
        throw new Error('Document failed validation');
      }
    }
  }
}
