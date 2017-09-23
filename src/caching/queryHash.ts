import {CacheEvaluator, QueryOptions} from '../interfaces';

export class QueryHashEvaluator implements CacheEvaluator {
  protected cachedQueries: {[query: string]: any} = {};

  public isCached(selector: any, options: QueryOptions): boolean {
    return this.hash(selector, options) in this.cachedQueries;
  }

  public setCached(selector: any, options: QueryOptions) {
    this.cachedQueries[this.hash(selector, options)] = options;
  }

  public add(doc: any) { return; }

  public optimizeQuery(selector: any, options: QueryOptions): any {
    return {selector: selector, options: options};
  }

  protected hash(selector: Object, options?: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options || {});
  }
}
