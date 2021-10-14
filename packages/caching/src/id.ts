import {Filter} from '@tashmit/database';
import {CacheEvaluator} from './evaluator';

export class IDCache extends CacheEvaluator {
  public add(doc: any) {
    this.cache(doc._id);
  }

  public remove(doc: any) {
    this.invalidate(doc._id);
  }

  public optimize(filter: Filter<any>) {
    if (filter && typeof filter._id === 'object' && filter._id.hasOwnProperty('$in')) {
      filter._id['$in'] = filter._id['$in'].filter((id: string) => !this.isValid(id));
    }
  }

  public isCached(filter?: Filter<any>): boolean {
    if (!filter || !filter.hasOwnProperty('_id')) {
      return false;
    }
    if (typeof filter._id === 'string') {
      return this.isValid(filter._id);
    }
    if (typeof filter._id === 'object' && filter._id.hasOwnProperty('$in')) {
      return filter._id['$in'].reduce((result: boolean, id: string) => {
        return result && this.isValid(id);
      }, true);
    }
    return false;
  }
}
