import {QueryOptions} from '@ziqquratu/database';
import {CacheEvaluator} from './evaluator';
import {hashCode} from 'mingo/util';

export class QueryCache extends CacheEvaluator {
  public isCached(selector?: any, options?: QueryOptions): boolean {
    return this.isValid(this.hash(selector, options));
  }

  public success(selector?: any, options?: QueryOptions) {
    const hash = this.hash(selector, options);
    if (hash) {
      this.cache(hash);
    }
  }

  protected hash(selector: Record<string, any>, options?: QueryOptions): string | null {
    return hashCode({selector, ...options})
  }
}
