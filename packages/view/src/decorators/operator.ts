import {propertyDecorator} from '@ziqquratu/core';
import {SortingDirection} from '@ziqquratu/database';
import {AggregatorAnnotation} from '../aggregator';

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

export class SkipAnnotation extends AggregatorAnnotation {
  public step(instance: any) {
    const value = instance[this.propertyKey];

    if (value !== undefined && value > 0) {
      return {$skip: value};
    }
    return null;
  }
}

export class LimitAnnotation extends AggregatorAnnotation {
  public step(instance: any) {
    const value = instance[this.propertyKey];

    if (value !== undefined) {
      return {$limit: value};
    }
    return null;
  }
}

export class SortAnnotation extends AggregatorAnnotation {
  public constructor(
    private sortKey: string,
    propertyKey: string,
  ) {
    super(propertyKey);
  }

  public step(instance: any) {
    const value: SortingDirection | undefined = instance[this.propertyKey];

    if (value !== undefined) {
      return {$sort: {[this.sortKey]: value}};
    }
    return null;
  }
}

export interface RegexConfig extends OperatorConfig {
  options?: string;
}

export class MatchAnnotation extends AggregatorAnnotation {
  public step(instance: any) {
    const value = instance[this.propertyKey];
    if (value !== undefined) {
      return {$match: this.selector(instance)};
    }
    return null;
  }

  protected selector(instance: any) {
    return instance[this.propertyKey];
  }
}

export class QueryOperatorAnnotation extends MatchAnnotation {
  private key: string;

  public constructor(
    propertyKey: string,
    key: string | undefined,
    private compile: (value: any) => object,
  ) {
    super(propertyKey);
    this.key = key || propertyKey;
  }

  protected selector(instance: any) {
    return {[this.key]: this.compile(instance[this.propertyKey])};
  }
}
export class RegexAnnotation extends QueryOperatorAnnotation {
  public constructor(propertyKey: string, config: RegexConfig) {
    super(propertyKey, config.key, value => ({$regex: value, $options: config.options}));
  }
}


export namespace Op {
  export const $match = propertyDecorator<object>(
    ({propertyKey}) => new MatchAnnotation(propertyKey));

  /** Matches values that are equal to a specified value. */
  export const $eq = queryOpDecorator('$eq');

  /** Matches values that are greater than a specified value. */
  export const $gt = queryOpDecorator('$gt');

  /** Matches values that are greater than or equal to a specified value. */
  export const $gte = queryOpDecorator('$gte');

  /** Matches any of the values specified in an array. */
  export const $in = queryOpDecorator<any[]>('$in');

  /** Matches values that are less than a specified value. */
  export const $lt = queryOpDecorator('$lt');

  /** Matches values that are less than or equal to a specified value. */
  export const $lte = queryOpDecorator('$lte');

  /** Matches all values that are not equal to a specified value. */
  export const $ne = queryOpDecorator('$ne');

  /** Matches none of the values specified in an array. */
  export const $nin = queryOpDecorator<any[]>('$nin');

  /** Matches documents that have the specified field. */
  export const $exists = queryOpDecorator<boolean>('$exists');

  /** Selects documents if a field is of the specified type. */
  export const $type = queryOpDecorator<string>('$type');

  export const $regex = (configOrKey?: RegexConfig | string) =>
    propertyDecorator<string>(({propertyKey}) => new RegexAnnotation(
      propertyKey, typeof configOrKey === 'string' ? {key: configOrKey} : configOrKey || {}))

  export const $all = queryOpDecorator<any[]>('$all');
  export const $size = queryOpDecorator<number>('$size');

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

  function queryOpDecorator<T = any>(operator: string) {
    return (key?: string) => propertyDecorator<T>(({propertyKey}) =>
      new QueryOperatorAnnotation(propertyKey, key, value => ({[operator]: value})));
  }
}
