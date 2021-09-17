import {QueryOptions} from '@ziqquratu/database';
import {CacheEvaluator} from './evaluator';

export class QueryCache extends CacheEvaluator {
  public isCached(selector?: any, options?: QueryOptions): boolean {
    return this.isValid(this.hash(selector, options));
  }

  public success(selector?: any, options?: QueryOptions) {
    this.cache(this.hash(selector, options));
  }

  protected hash(selector: Record<string, any>, options?: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options || {});
  }
}
