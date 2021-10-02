import {Filter, QueryOptions} from '@ziqquratu/database';
import {CacheEvaluator} from './evaluator';
import {hashCode} from 'mingo/util';

export class QueryCache extends CacheEvaluator {
  public isCached(filter?: Filter<any>, options?: QueryOptions): boolean {
    return this.isValid(this.hash(filter, options));
  }

  public success(filter?: Filter<any>, options?: QueryOptions) {
    const hash = this.hash(filter, options);
    if (hash) {
      this.cache(hash);
    }
  }

  protected hash(filter?: Filter<any>, options?: QueryOptions): string | null {
    return hashCode({filter, ...options})
  }
}
