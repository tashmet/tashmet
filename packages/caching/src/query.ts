import {Filter, FindOptions, HashCode} from '@tashmet/tashmet';
import {CacheEvaluator} from './evaluator';

export class QueryCache extends CacheEvaluator {
  public constructor(ttl: number | undefined, private hashCode: HashCode) {
    super(ttl);
  }

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
    return this.hashCode({filter, ...options})
  }
}
