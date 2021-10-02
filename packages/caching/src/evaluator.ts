import {QueryOptions} from '@ziqquratu/database';

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
  evaluators: CacheEvaluator[], selector: object, options: QueryOptions
) {
  for (const evaluator of evaluators) {
    evaluator.optimize(selector || {}, options);
    if (evaluator.isCached(selector, options)) {
      return true;
    }
  }
  return false;
}
