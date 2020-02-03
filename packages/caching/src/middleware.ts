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
    private next: (selector: object) => Cursor<any>,
    selector: object
  ) {
    super(selector);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.selector))
      ? this.cache.find(this.selector)
      : this.next(this.selector);

    return this.applyTo(cursor).count(applySkipLimit);
  }

  public async toArray(): Promise<any[]> {
    const cacheCursor = this.applyTo(this.cache.find(this.selector));

    if (!this.isCached()) {
      const docs = await this.next(this.selector).toArray();
      for (const doc of docs) {
        await this.cache.upsert(doc);
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

  private applyTo(cursor: Cursor<any>): Cursor<any> {
    if (this.options.sort) {
      for (const [key, direction] of this.options.sort) {
        cursor.sort(key, direction);
      }
    }
    if (this.options.offset) {
      cursor.skip(this.options.offset);
    }
    if (this.options.limit) {
      cursor.limit(this.options.limit);
    }
    return cursor;
  }
}
