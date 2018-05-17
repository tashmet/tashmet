import {Middleware, after, before} from '@ziggurat/ningal';
import {CacheQuery, Query, QueryOptions, Step, Pipe} from '../../interfaces';

export class QueryHashEvaluator extends Middleware {
  protected cachedQueries: {[query: string]: any} = {};

  @before({
    step: Step.CacheQuery,
    pipe: Pipe.Find
  })
  public processCacheQuery(q: CacheQuery): CacheQuery {
    q.cached = q.cached || this.isCached(q.selector, q.options);
    return q;
  }

  @before({
    step: Step.SourceQuery,
    pipe: Pipe.Find
  })
  public processSourceQuery(q: Query): Query {
    this.optimizeQuery(q.selector, q.options);
    this.setCached(q.selector, q.options);
    return q;
  }

  protected optimizeQuery(selector: any, options: QueryOptions) {
    return;
  }

  protected setCached(selector: any, options: QueryOptions) {
    this.cachedQueries[this.hash(selector, options)] = options;
  }

  protected isCached(selector: any, options: QueryOptions): boolean {
    return this.hash(selector, options) in this.cachedQueries;
  }

  protected hash(selector: Object, options?: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options || {});
  }
}
