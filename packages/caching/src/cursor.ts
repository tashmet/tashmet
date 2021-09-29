import {Collection, Cursor, QueryOptions, applyQueryOptions, AbstractCursor} from '@ziqquratu/database';
import {CacheEvaluator, isCached} from './evaluator';

export class CachingCursor extends AbstractCursor<any> {
  public constructor(
    private evaluators: CacheEvaluator[],
    private cache: Collection,
    private findInNext: (selector: object) => Cursor<any>,
    selector: object = {},
    options: QueryOptions = {},
  ) {
    super(selector, options);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.selector))
      ? this.cache.find(this.selector)
      : this.findInNext(this.selector);

    return applyQueryOptions(cursor, this.options).count(applySkipLimit);
  }

  public async toArray(): Promise<any[]> {
    const cacheCursor = applyQueryOptions(this.cache.find(this.selector), this.options);

    if (!this.isCached()) {
      const docs = await this.findInNext(this.selector).toArray();
      for (const doc of docs) {
        await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      }
      for (const evaluator of this.evaluators) {
        evaluator.success(this.selector, this.options);
      }
    }
    return cacheCursor.toArray();
  }

  private isCached(): boolean {
    return isCached(this.evaluators, this.selector, this.options);
  }
}
