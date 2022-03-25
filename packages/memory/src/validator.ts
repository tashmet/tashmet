import {provider} from '@tashmet/core';
import {Document, Validator, ValidatorFactory} from '@tashmet/database';
import {Query} from 'mingo';

export function filterValidator<T>(rules: Document): Validator<T> {
  const query = new Query(rules as any);

  return (doc: any) => {
    if (query.test(doc)) {
      return doc;
    } else {
      throw new Error('Document failed validation');
    }
  }
}

@provider({
  key: ValidatorFactory
})
export class SimpleValidatorFactory extends ValidatorFactory {
  public create<T>(rules: Document): Validator<T> {
    return filterValidator(rules);
  }
}
