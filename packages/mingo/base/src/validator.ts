import { Document } from '@tashmet/tashmet';
import { provider, Optional } from '@tashmet/core';
import { ValidatorFactory, JsonSchemaValidator } from '@tashmet/engine';
import { MingoConfig } from './interfaces.js';
import { Query } from 'mingo';

@provider({
  key: ValidatorFactory,
  inject: [MingoConfig, Optional.of(JsonSchemaValidator)]
})
export class MingoValidatorFactory extends ValidatorFactory {
  constructor(
    private config: MingoConfig,
    private jsonSchemaValidator?: JsonSchemaValidator,
  ) { super(); }

  createValidator(rules: Document) {
    const v = this.jsonSchemaValidator;

    const query = new Query(rules as any, {
      ...this.config,
      jsonSchemaValidator: v !== undefined
        ? (s: any) => { return (o: any) => v.validate(o, s); }
        : undefined
    });

    return (doc: any) => {
      if (query.test(doc)) {
        return doc;
      } else {
        throw new Error('Document failed validation');
      }
    }
  }
}
