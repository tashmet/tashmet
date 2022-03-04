import {Filter, FindOptions} from '@tashmit/database';

export abstract class CacheEvaluator {
  private records: Record<string, number> = {};

  public constructor(private ttl?: number) {}

  public add(doc: any): void {
     return;
  }

  public remove(id: any): void {
    return;
  }

  public optimize(filter: Filter<any>, options?: FindOptions): void {
    return;
  }

  public isCached(filter: Filter<any>, options?: FindOptions): boolean {
    return false;
  }

  public success(filter: Filter<any>, options?: FindOptions): void {
    return;
  }

  protected cache(key: string) {
    this.records[key] = this.now;
  }

  protected invalidate(key: string) {
    delete this.records[key];
  }

  protected isValid(key: string | null): boolean {
    return key !== null && key in this.records && !this.isExpired(this.records[key]);
  }

  private isExpired(timestamp: number): boolean {
    return this.ttl !== undefined && this.now - timestamp > (this.ttl * 1000)
  }

  private get now(): number {
    return new Date().getTime();
  }
}

export function isCached(
  evaluators: CacheEvaluator[], filter: Filter<any>, options: FindOptions
) {
  for (const evaluator of evaluators) {
    evaluator.optimize(filter || {}, options);
    if (evaluator.isCached(filter, options)) {
      return true;
    }
  }
  return false;
}
