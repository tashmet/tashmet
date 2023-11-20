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

  /** Add a group stage to the aggregation pipeline */
  public group<T extends Document = TSchema>($group: Document): AggregationCursor<T> {
    return this.pushStage({$group});
  }

  /** Add a limit stage to the aggregation pipeline */
  public limit($limit: number): AggregationCursor<TSchema> {
    return this.pushStage({$limit});
  }

  /** Add a match stage to the aggregation pipeline */
  public match($match: Document): AggregationCursor<TSchema> {
    return this.pushStage({$match});
  }

  /** Add an out stage to the aggregation pipeline */
  public out($out: { db: string; coll: string } | string): AggregationCursor<TSchema> {
    return this.pushStage({$out});
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
  public project<T extends Document = TSchema>($project: Document): AggregationCursor<T> {
    return this.pushStage({$project});
  }

  /** Add a lookup stage to the aggregation pipeline */
  public lookup($lookup: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $lookup });
  }

  /** Add a redact stage to the aggregation pipeline */
  public redact($redact: Document): AggregationCursor<TSchema> {
    return this.pushStage({ $redact });
  }

  /** Add a skip stage to the aggregation pipeline */
  public skip($skip: number): AggregationCursor<TSchema> {
    return this.pushStage({ $skip });
  }

  /** Add a sort stage to the aggregation pipeline */
  public sort($sort: SortingMap): AggregationCursor<TSchema> {
    return this.pushStage({ $sort });
  }

  /** Add a unwind stage to the aggregation pipeline */
  public unwind($unwind: Document | string): AggregationCursor<TSchema> {
    return this.pushStage({ $unwind });
  }

  public pushStage<T extends Document = TSchema>(stage: Document): AggregationCursor<T> {
    this.pipeline.push(stage);
    return this as unknown as AggregationCursor<T>;
  }
}
