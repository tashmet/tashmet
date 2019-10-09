import {Collection, QueryOptions} from '../interfaces';
import {Middleware} from '../collections/managed';

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
}

export class CachingMiddleware extends Middleware {
  public constructor(
    source: Collection,
    cache: Collection,
    private evaluator: CacheEvaluator
  ) {
    super(source);

    cache.on('document-upserted', doc => this.evaluator.add(doc));
    cache.on('document-removed', doc => this.evaluator.remove(doc));
  }

  public find(next: Function) {
    return async (selector?: any, options?: QueryOptions) => {
      this.evaluator.optimize(selector || {}, options);
      return this.evaluator.isCached(selector) ? [] : next(selector, options);
    };
  }
}

export class CachingEndpoint extends Middleware {
  public constructor(
    source: Collection,
    private cache: Collection
  ) {
    super(source);
  }

  public find(next: Function) {
    return async (selector?: any, options?: QueryOptions) => {
      const originalSelector = this.clone(selector);
      const originalOptions = this.clone(options);

      for (let doc of await next(selector, options)) {
        await this.cache.upsert(doc);
      }
      return this.cache.find(originalSelector, originalOptions);
    };
  }

  private clone<T>(obj: T): T {
    return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
  }
}
