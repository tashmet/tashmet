import {propertyDecorator} from '@ziqquratu/core';
import {FilterAnnotation, FilterConfig} from './filter';

/**
 * Configuration options for operators
 */
export interface OperatorConfig {
  /**
   * The key that the operator should be applied to.
   *
   * If no key is specified the name of the decorated property is used as key.
   */
  key?: string;
}

/**
 * Filter documents using query operators
 */
export class Operator extends FilterAnnotation {
  /** Matches values that are equal to a specified value. */
  static $eq(config?: OperatorConfig) {
    return Operator.decorator('$eq', config);
  }
  /** Matches values that are greater than a specified value. */
  static $gt(config?: OperatorConfig) {
    return Operator.decorator('$gt', config);
  }
  /** Matches values that are greater than or equal to a specified value. */
  static $gte(config?: OperatorConfig) {
    return Operator.decorator('$gte', config);
  }
  /** Matches any of the values specified in an array. */
  static $in(config?: OperatorConfig) {
    return Operator.decorator<any[]>('$in', config);
  }
  /** Matches values that are less than a specified value. */
  static $lt(config?: OperatorConfig) {
    return Operator.decorator('$lt', config);
  }
  /** Matches values that are less than or equal to a specified value. */
  static $lte(config?: OperatorConfig) {
    return Operator.decorator('$lte', config);
  }
  /** Matches all values that are not equal to a specified value. */
  static $ne(config?: OperatorConfig) {
    return Operator.decorator('$ne', config);
  }
  /** Matches none of the values specified in an array. */
  static $nin(config?: OperatorConfig) {
    return Operator.decorator<any[]>('$nin', config);
  }

  /** Matches documents that have the specified field. */
  static $exists(config?: OperatorConfig) {
    return Operator.decorator<boolean>('$exists', config);
  }
  /** Selects documents if a field is of the specified type. */
  static $type(config?: OperatorConfig) {
    return Operator.decorator<string>('$type', config);
  }

  static $all(config?: OperatorConfig) {
    return Operator.decorator<any[]>('$all', config);
  }
  static $size(config?: OperatorConfig) {
    return Operator.decorator<number>('$size', config);
  }

  private static decorator<T = any>(operator: string, config?: OperatorConfig) {
    return propertyDecorator<T>((target, propertyKey) => {
      const key = config?.key || propertyKey;

      const filterConfig: FilterConfig<string> = {
        compile: value => ({[key]: {[operator]: value }}),
        disableOn: ''
      };

      return new FilterAnnotation(filterConfig, propertyKey)
    });
  }
}
