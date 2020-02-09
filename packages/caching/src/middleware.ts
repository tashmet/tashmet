import {Collection, Cursor, QueryOptions, AbstractCursor} from '@ziqquratu/database';

export abstract class CacheEvaluator {
  public add(doc: any): void {
     return;
  }

  public remove(doc: any): void {
    return;
  }

  public optimize(selector: any, options?: QueryOptions): void {
    return;
  }

  public isCached(selector: any, options?: QueryOptions): boolean {
    return false;
  }

  public success(selector: any, options?: QueryOptions): void {
    return;
  }
}

export class CachingCursor extends AbstractCursor<any> {
  public constructor(
    private evaluators: CacheEvaluator[],
    private cache: Collection,
    private findInNext: (selector: object) => Cursor<any>,
    selector: object
  ) {
    super(selector);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.selector))
      ? this.cache.find(this.selector)
      : this.findInNext(this.selector);

    return AbstractCursor.applyOptions(cursor, this.options).count(applySkipLimit);
  }

  public async toArray(): Promise<any[]> {
    const cacheCursor = AbstractCursor.applyOptions(this.cache.find(this.selector), this.options);

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
    for (const evaluator of this.evaluators) {
      evaluator.optimize(this.selector || {}, this.options);
      if (evaluator.isCached(this.selector, this.options)) {
        return true;
      }
    }
    return false;
  }
}
