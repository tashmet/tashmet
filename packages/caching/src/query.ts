import {Filter, FindOptions} from '@tashmit/database';
import {CacheEvaluator} from './evaluator';
import {hashCode} from 'mingo/util';

export class QueryCache extends CacheEvaluator {
  public isCached(filter?: Filter<any>, options?: FindOptions): boolean {
    return this.isValid(this.hash(filter, options));
  }

  public success(filter?: Filter<any>, options?: FindOptions) {
    const hash = this.hash(filter, options);
    if (hash) {
      this.cache(hash);
    }
  }

  protected hash(filter?: Filter<any>, options?: FindOptions): string | null {
    return hashCode({filter, ...options})
  }
}
