import {PropertyDecorator} from "@tashmit/core";
import {Projection, SortingDirection, SortingMap} from "@tashmit/database";
import {stageDecorator} from "./pipeline";
import {queryOpDecorator, RegexConfig} from "./query";

export const stage = stageDecorator;

type SortType<T> =
  T extends string ? SortingDirection | undefined :
  T extends undefined ? SortingMap | undefined :
  never;

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
 *   @sort('datePublished') public dateSort = -1;
 * }
 * ```
 *
 * If no key is given, the decorated property is expected to be a sorting map:
 *
 * ```typescript
 * class MyView extends ItemSet {
 *   @sort() public dateSort = {datePublished: -1};
 * }
 * ```
 */
export function sort<T extends string | undefined = undefined>(key?: T)
  : PropertyDecorator<SortType<T>>
{
  return typeof key === 'string'
    ? stage<SortingDirection | undefined>('$sort', value => ({[key]: value}))
    : stage<SortingMap | undefined>('$sort');
}

function matchOp<T = any>(op: string) {
  return (key?: string) => queryOpDecorator<T>(v => ({[op]: v}), key);
}

export const skip = stage<number | undefined>('$skip');
export const limit = stage<number | undefined>('$limit');
export const project = stage<Projection<any> | undefined>('$project');
export const group = stage<Record<string, any>>('$group');
export const count = stage<string>('$count');

export const match = {
  /** Matches values that are equal to a specified value. */
  eq: matchOp('$eq'),

  /** Matches values that are greater than a specified value. */
  gt: matchOp('$gt'),

  /** Matches values that are greater than or equal to a specified value. */
  gte: matchOp('$gte'),

  /** Matches any of the values specified in an array. */
  in: matchOp<any[]>('$in'),

  /** Matches values that are less than a specified value. */
  lt: matchOp('$lt'),

  /** Matches values that are less than or equal to a specified value. */
  lte: matchOp('$lte'),

  /** Matches all values that are not equal to a specified value. */
  ne: matchOp('$ne'),

  /** Matches none of the values specified in an array. */
  nin: matchOp<any[]>('$nin'),

  /** Matches documents that have the specified field. */
  exists: matchOp<boolean>('$exists'),

  /** Selects documents if a field is of the specified type. */
  type: matchOp<string>('$type'),

  regex: (configOrKey?: RegexConfig | string) => {
    const config = typeof configOrKey === 'string'
      ? {key: configOrKey}
      : configOrKey || {};
    return queryOpDecorator<RegExp>(v => ({
      $regex: v, $options: config.options
    }), config.key);
  },

  all: matchOp<any[]>('$all'),

  size: matchOp<number>('$size'),
}
