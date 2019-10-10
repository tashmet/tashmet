import {QueryOptions} from '../interfaces';
import {CacheEvaluator} from './middleware';

export class QueryCache extends CacheEvaluator {
  protected cachedQueries: {[query: string]: any} = {};

  public isCached(selector?: any, options?: QueryOptions): boolean {
    return this.hash(selector, options) in this.cachedQueries;
  }

  public success(selector?: any, options?: QueryOptions) {
    this.cachedQueries[this.hash(selector, options)] = options;
  }

  protected hash(selector: Object, options?: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options || {});
  }
}
