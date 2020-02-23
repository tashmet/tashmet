import {CacheEvaluator} from './middleware';

export class IDCache extends CacheEvaluator {
  public add(doc: any) {
    this.cache(doc._id);
  }

  public remove(doc: any) {
    this.invalidate(doc._id);
  }

  public optimize(selector: any) {
    if (selector && typeof selector._id === 'object' && selector._id.hasOwnProperty('$in')) {
      selector._id['$in'] = selector._id['$in'].filter((id: string) => !this.isValid(id));
    }
  }

  public isCached(selector?: any): boolean {
    if (!selector || !selector.hasOwnProperty('_id')) {
      return false;
    }
    if (typeof selector._id === 'string') {
      return this.isValid(selector._id);
    }
    if (typeof selector._id === 'object' && selector._id.hasOwnProperty('$in')) {
      return selector._id['$in'].reduce((result: boolean, id: string) => {
        return result && this.isValid(id);
      }, true);
    }
    return false;
  }
}
