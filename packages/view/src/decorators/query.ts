import {Filter} from '@tashmit/database';
import {stageDecorator} from './pipeline';

export interface RegexConfig {
  /**
   * The key that the operator should be applied to.
   *
   * If no key is specified the name of the decorated property is used as key.
   */
  key?: string;

  options?: string;
}

export function queryOpDecorator<T = any>(
  compile: (value: T) => any, key?: string,
) {
  return stageDecorator<any, Filter<any>>('$match', (value, propertyKey) => ({
    [key || propertyKey]: compile(value)
  }));
}
