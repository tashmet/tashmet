import {Collection, Cursor, QueryOptions, applyQueryOptions, AbstractCursor} from '@ziqquratu/database';

export abstract class CacheEvaluator {
  private records: Record<string, number> = {};

  public constructor(private ttl?: number) {}

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

  public success(selector: any, options?: QueryOptions): void {
    return;
  }

  protected cache(key: string) {
    this.records[key] = this.now;
  }
  
  protected invalidate(key: string) {
    delete this.records[key];
  }
  
  protected isValid(key: string): boolean {
    return key in this.records && !this.isExpired(this.records[key]);
  }

  private isExpired(timestamp: number): boolean {
    return this.ttl !== undefined && this.now - timestamp > (this.ttl * 1000)
  }

  private get now(): number {
    return new Date().getTime();
  }
}

export class CachingCursor extends AbstractCursor<any> {
  public constructor(
    private evaluators: CacheEvaluator[],
    private cache: Collection,
    private findInNext: (selector: object) => Cursor<any>,
    selector: object = {},
    options: QueryOptions = {},
  ) {
    super(selector, options);
  }

  public async count(applySkipLimit = true) {
    const cursor = this.evaluators.some(e => e.isCached(this.selector))
      ? this.cache.find(this.selector)
      : this.findInNext(this.selector);

    return applyQueryOptions(cursor, this.options).count(applySkipLimit);
  }

  public async toArray(): Promise<any[]> {
    const cacheCursor = applyQueryOptions(this.cache.find(this.selector), this.options);

    if (!this.isCached()) {
      const docs = await this.findInNext(this.selector).toArray();
      for (const doc of docs) {
        await this.cache.replaceOne({_id: doc._id}, doc, {upsert: true});
      }
      for (const evaluator of this.evaluators) {
        evaluator.success(this.selector, this.options);
      }
    }
    return cacheCursor.toArray();
  }

  private isCached(): boolean {
    for (const evaluator of this.evaluators) {
      evaluator.optimize(this.selector || {}, this.options);
      if (evaluator.isCached(this.selector, this.options)) {
        return true;
      }
    }
    return false;
  }
}
