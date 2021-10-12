import {Projection, SortingDirection} from "@ziqquratu/database";
import {stageDecorator} from "./pipeline";
import {queryOpDecorator, RegexConfig} from "./query";

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
 *   @Op.$sort('datePublished')
 *   public dateSort = SortingDirection.Descending;
 * }
 * ```
 */
export const $sort = (key: string) => stageDecorator<SortingDirection | undefined>(
  '$sort', value => ({[key]: value}));

export const $skip = stageDecorator<number | undefined>('$skip');
export const $limit = stageDecorator<number | undefined>('$limit');

export const $match = stageDecorator<object | undefined>('$match');
export const $project = stageDecorator<Projection<any> | undefined>('$project');

/** Matches values that are equal to a specified value. */
export const $eq = (key?: string) =>
  queryOpDecorator(v => ({$eq: v}), key);

/** Matches values that are greater than a specified value. */
export const $gt = (key?: string) =>
  queryOpDecorator(v => ({$gt: v}), key);

/** Matches values that are greater than or equal to a specified value. */
export const $gte = (key?: string) =>
  queryOpDecorator(v => ({$gte: v}), key);

/** Matches any of the values specified in an array. */
export const $in = (key?: string) =>
  queryOpDecorator(v => ({$in: v}), key);

/** Matches values that are less than a specified value. */
export const $lt = (key?: string) =>
  queryOpDecorator(v => ({$lt: v}), key);

/** Matches values that are less than or equal to a specified value. */
export const $lte = (key?: string) =>
  queryOpDecorator(v => ({$lte: v}), key);

/** Matches all values that are not equal to a specified value. */
export const $ne = (key?: string) =>
  queryOpDecorator<string>(v => ({$ne: v}), key);

/** Matches none of the values specified in an array. */
export const $nin = (key?: string) =>
  queryOpDecorator<any[]>(v => ({$nin: v}), key);

/** Matches documents that have the specified field. */
export const $exists = (key?: string) =>
  queryOpDecorator<boolean>(v => ({$exists: v}), key);

/** Selects documents if a field is of the specified type. */
export const $type = (key?: string) =>
  queryOpDecorator<string>(v => ({$type: v}), key);

export const $regex = (configOrKey?: RegexConfig | string) => {
  const config = typeof configOrKey === 'string'
    ? {key: configOrKey}
    : configOrKey || {};
  return queryOpDecorator<string>(v => ({
    $regex: v, $options: config.options
  }), config.key);
}

export const $all = (key?: string) =>
  queryOpDecorator<any[]>(v => ({$all: v}), key);

export const $size = (key?: string) =>
  queryOpDecorator<number>(v => ({$size: v}), key);
