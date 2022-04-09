import {
  Cursor,
  FindOptions,
  applyFindOptions,
  AbstractCursor,
  Filter,
  Store,
  ChangeSet
} from '@tashmet/tashmet';
import {CacheEvaluator, isCached} from './evaluator';

export class CachingCursor extends AbstractCursor<any> {
  public constructor(
    private evaluators: CacheEvaluator[],
    private cache: Store<any>,
    private findInNext: (selector: object) => Cursor<any>,
    filter: Filter<any> = {},
    options: FindOptions = {},
  ) {
    super(filter, options);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.filter))
      ? this.cache.find(this.filter)
      : this.findInNext(this.filter);

    return applyFindOptions(cursor, this.options).count(applySkipLimit);
  }

  public async fetchAll(): Promise<any[]> {
    const cacheCursor = this.cache.find(
      JSON.parse(JSON.stringify(this.filter)),
      JSON.parse(JSON.stringify(this.options))
    );

    if (!this.isCached()) {
      const incoming = await this.findInNext(this.filter).toArray();
      const outgoing = await this.cache.find(this.filter).toArray();
      await this.cache.write(new ChangeSet(incoming, outgoing));

      for (const evaluator of this.evaluators) {
        evaluator.success(this.filter, this.options);
      }
    }
    return cacheCursor.toArray();
  }

  private isCached(): boolean {
    return isCached(this.evaluators, this.filter, this.options);
  }
}
