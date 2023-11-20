import { Document, SortingMap, TashmetProxy } from '../interfaces.js';
import { AggregateOptions } from '../operations/aggregate.js';
import { TashmetNamespace } from '../utils.js';
import { AbstractCursor } from './abstractCursor.js';

export class AggregationCursor<TSchema extends Document = Document> extends AbstractCursor<TSchema> {
  public constructor(
    namespace: TashmetNamespace,
    proxy: TashmetProxy,
    public readonly pipeline: Document[],
    options: AggregateOptions = {},
  ) {
    super(namespace, proxy, options);
  }

  protected async initialize(): Promise<Document> {
    return this.proxy.command(this.namespace, {
      aggregate: this.namespace.collection || 1,
      pipeline: this.pipeline,
      ...this.options
    });
  }

  /** Add an addFields stage to the aggregation pipeline */
  addFields<T extends Document = TSchema>($addFields: Document): AggregationCursor<T> {
    return this.pushStage({ $addFields });
  }

  /** Add a bucket stage to the aggregation pipeline */
  bucket<T extends Document = TSchema>($bucket: Document): AggregationCursor<T> {
    return this.pushStage({ $bucket });
  }

  /** Add a bucketAuto stage to the aggregation pipeline */
  bucketAuto<T extends Document = TSchema>($bucketAuto: Document): AggregationCursor<T> {
    return this.pushStage({ $bucketAuto });
  }

  /** Add a count stage to the aggregation pipeline */
  count<T extends Document = TSchema>($count: Document): AggregationCursor<T> {
    return this.pushStage({ $count });
  }

  /** Add a facet stage to the aggregation pipeline */
  facet<T extends Document = TSchema>($facet: Document): AggregationCursor<T> {
    return this.pushStage({ $facet });
  }

  /** Add a fill stage to the aggregation pipeline */
  fill($fill: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $fill });
  }

  /** Add a group stage to the aggregation pipeline */
  group<T extends Document = TSchema>($group: Document): AggregationCursor<T> {
    return this.pushStage({ $group });
  }

  /** Add a limit stage to the aggregation pipeline */
  limit($limit: number): AggregationCursor<TSchema> {
    return this.pushStage({ $limit });
  }

  /** Add a lookup stage to the aggregation pipeline */
  lookup($lookup: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $lookup });
  }

  /** Add a match stage to the aggregation pipeline */
  match($match: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $match });
  }

  /** Add an out stage to the aggregation pipeline */
  out($out: { db: string; coll: string } | string): AggregationCursor<TSchema> {
    return this.pushStage({ $out });
  }

  /**
   * Add a project stage to the aggregation pipeline
   *
   * @remarks
   * In order to strictly type this function you must provide an interface
   * that represents the effect of your projection on the result documents.
   *
   * By default chaining a projection to your cursor changes the returned type to the generic {@link Document} type.
   * You should specify a parameterized type to have assertions on your final results.
   *
   * @example
   * ```typescript
   * // Best way
   * const docs: AggregationCursor<{ a: number }> = cursor.project<{ a: number }>({ _id: 0, a: true });
   * // Flexible way
   * const docs: AggregationCursor<Document> = cursor.project({ _id: 0, a: true });
   * ```
   *
   * @remarks
   * In order to strictly type this function you must provide an interface
   * that represents the effect of your projection on the result documents.
   *
   * **Note for Typescript Users:** adding a transform changes the return type of the iteration of this cursor,
   * it **does not** return a new instance of a cursor. This means when calling project,
   * you should always assign the result to a new variable in order to get a correctly typed cursor variable.
   * Take note of the following example:
   *
   * @example
   * ```typescript
   * const cursor: AggregationCursor<{ a: number; b: string }> = coll.aggregate([]);
   * const projectCursor = cursor.project<{ a: number }>({ _id: 0, a: true });
   * const aPropOnlyArray: {a: number}[] = await projectCursor.toArray();
   *
   * // or always use chaining and save the final cursor
   *
   * const cursor = coll.aggregate().project<{ a: string }>({
   *   _id: 0,
   *   a: { $convert: { input: '$a', to: 'string' }
   * }});
   * ```
   */
  project<T extends Document = TSchema>($project: Document): AggregationCursor<T> {
    return this.pushStage({ $project });
  }

  /** Add a redact stage to the aggregation pipeline */
  redact($redact: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $redact });
  }

  /** Add a replaceRoot stage to the aggregation pipeline */
  replaceRoot<T extends Document = TSchema>($replaceRoot: { newRoot: Document }): AggregationCursor<T> {
    return this.pushStage({ $replaceRoot });
  }

  /** Add a replaceWith stage to the aggregation pipeline */
  replaceWith<T extends Document = TSchema>($replaceWith: Document): AggregationCursor<T> {
    return this.pushStage({ $replaceWith });
  }

  /** Add a sample stage to the aggregation pipeline */
  sample($sample: { size: number }): AggregationCursor<TSchema> {
    return this.pushStage({ $sample });
  }

  /** Add a set stage to the aggregation pipeline */
  set<T extends Document = TSchema>($set: Document): AggregationCursor<T> {
    return this.pushStage({ $set });
  }

  /** Add a skip stage to the aggregation pipeline */
  skip($skip: number): AggregationCursor<TSchema> {
    return this.pushStage({ $skip });
  }

  /** Add a sort stage to the aggregation pipeline */
  sort($sort: SortingMap): AggregationCursor<TSchema> {
    return this.pushStage({ $sort });
  }

  /** Add an unset stage to the aggregation pipeline */
  unset<T extends Document = TSchema>($unset: string | string[]): AggregationCursor<T> {
    return this.pushStage({ $unset });
  }

  /** Add a unwind stage to the aggregation pipeline */
  unwind($unwind: Document | string): AggregationCursor<TSchema> {
    return this.pushStage({ $unwind });
  }

  pushStage<T extends Document = TSchema>(stage: Document): AggregationCursor<T> {
    this.pipeline.push(stage);
    return this as unknown as AggregationCursor<T>;
  }
}
