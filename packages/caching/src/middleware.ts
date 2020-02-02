import {Collection, Cursor, Middleware, QueryOptions, AbstractCursor} from '@ziqquratu/database';

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

  public async count(applySkipLimit?: boolean) {
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
      for (const key of Object.keys(this.options.sort)) {
        cursor.sort(key, this.options.sort[key]);
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

export class CachingMiddleware extends Middleware {
  public constructor(
    source: Collection,
    private cache: Collection,
    private evaluators: CacheEvaluator[]
  ) {
    super(source);

    for (const evaluator of this.evaluators) {
      cache.on('document-upserted', doc => evaluator.add(doc));
      cache.on('document-removed', doc => evaluator.remove(doc));
    }
  }

  public find(next: (selector: object) => Cursor<any>) {
    return (selector?: any) => {
      return new CachingCursor(this.evaluators, this.cache, next, selector);
    };
  }

  public onDocumentUpserted(next: any) {
    return async (doc: any) => {
      return next(await this.cache.upsert(doc));
    }
  }

  public onDocumentRemoved(next: any) {
    return async (doc: any) => {
      return next(await this.cache.delete(doc));
    }
  }
}
