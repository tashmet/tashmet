import {propertyDecorator} from '@ziqquratu/core';
import {Query, SortingDirection} from '@ziqquratu/database';
import {QueryPropertyAnnotation} from '../query';
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

export class SkipAnnotation extends QueryPropertyAnnotation {
  public apply(q: Query, instance: any) {
    const value = instance[this.propertyKey];

    if (value !== undefined && value > 0) {
      q.skip = value;
    }
  }
}

export class LimitAnnotation extends QueryPropertyAnnotation {
  public apply(q: Query, instance: any) {
    const value = instance[this.propertyKey];

    if (value !== undefined) {
      q.limit = value;
    }
  }
}

export class SortAnnotation extends QueryPropertyAnnotation {
  public constructor(
    private sortKey: string,
    propertyKey: string,
  ) {
    super(propertyKey);
  }

  public apply(q: Query, instance: any) {
    const value: SortingDirection | undefined = instance[this.propertyKey];

    if (value !== undefined) {
      q.sort = q.sort || {};
      q.sort[this.sortKey] = value;
    }
  }
}

export namespace Op {
  /** Matches values that are equal to a specified value. */
  export const $eq = filter('$eq');

  /** Matches values that are greater than a specified value. */
  export const $gt = filter('$gt');

  /** Matches values that are greater than or equal to a specified value. */
  export const $gte = filter('$gte');

  /** Matches any of the values specified in an array. */
  export const $in = filter<any[]>('$in');

  /** Matches values that are less than a specified value. */
  export const $lt = filter('$lt');

  /** Matches values that are less than or equal to a specified value. */
  export const $lte = filter('$lte');

  /** Matches all values that are not equal to a specified value. */
  export const $ne = filter('$ne');

  /** Matches none of the values specified in an array. */
  export const $nin = filter<any[]>('$nin');

  /** Matches documents that have the specified field. */
  export const $exists = filter<boolean>('$exists');

  /** Selects documents if a field is of the specified type. */
  export const $type = filter<string>('$type');
  export const $all = filter<any[]>('$all');
  export const $size = filter<number>('$size');

  /**
   * Sort documents according to a given key and order.
   *
   * A view can have multiple sorting properties acting on different keys.
   *
   * @usageNotes
   * Sorting articles according to their publication date could look as following:
   *
   * ```typescript
   * class MyView extends ItemSet {
   *   @Op.sort('datePublished')
   *   public dateSort = SortingDirection.Descending;
   * }
   * ```
   */
  export const $sort = (key: string) =>
    propertyDecorator<SortingDirection | undefined>(
      ({propertyKey}) => new SortAnnotation(key, propertyKey));

  export const $skip = propertyDecorator<number | undefined>(
    ({propertyKey}) => new SkipAnnotation(propertyKey)
  );

  export const $limit = propertyDecorator<number | undefined>(
    ({propertyKey}) => new LimitAnnotation(propertyKey)
  );

  function filter<T = any>(operator: string) {
    return (config?: OperatorConfig | string) =>
      propertyDecorator<T>(({propertyKey}) => {
        const key = typeof config === 'string'
          ? config
          : config?.key || propertyKey

        const filterConfig: FilterConfig<T> = {
          compile: value => ({[key]: {[operator]: value }}),
          disableOn: undefined,
        };

        return new FilterAnnotation(filterConfig, propertyKey)
      });
  }
}
