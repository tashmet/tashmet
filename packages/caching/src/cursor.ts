import {
  Collection,
  Cursor,
  QueryOptions,
  applyQueryOptions,
  AbstractCursor,
  Filter
} from '@tashmit/database';
import {CacheEvaluator, isCached} from './evaluator';

export class CachingCursor extends AbstractCursor<any> {
  public constructor(
    private evaluators: CacheEvaluator[],
    private cache: Collection,
    private findInNext: (selector: object) => Cursor<any>,
    filter: Filter<any> = {},
    options: QueryOptions = {},
  ) {
    super(filter, options);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.filter))
      ? this.cache.find(this.filter)
      : this.findInNext(this.filter);

    return applyQueryOptions(cursor, this.options).count(applySkipLimit);
  }

  public async toArray(): Promise<any[]> {
    const cacheCursor = this.cache.find(this.filter, this.options);

    if (!this.isCached()) {
      const docs = await this.findInNext(this.filter).toArray();
      for (const doc of docs) {
        await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      }
      for (const evaluator of this.evaluators) {
        evaluator.success(this.filter, this.options);
      }
    }
    return cacheCursor.toArray();
  }

  private isCached(): boolean {
    return isCached(this.evaluators, this.filter, this.options);
  }
}
