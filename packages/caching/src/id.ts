import {CacheEvaluator} from './middleware';

export class IDCache extends CacheEvaluator {
  private ids: {[id: string]: boolean} = {};

  public add(doc: any) {
    this.ids[doc._id] = true;
  }

  public remove(doc: any) {
    delete this.ids[doc._id];
  }

  public optimize(selector: any) {
    if (selector && typeof selector._id === 'object' && selector._id.hasOwnProperty('$in')) {
      selector._id['$in'] = selector._id['$in'].filter((id: string) => {
        return !(id in this.ids);
      });
    }
  }

  public isCached(selector?: any): boolean {
    if (!selector || !selector.hasOwnProperty('_id')) {
      return false;
    }
    if (typeof selector._id === 'string') {
      return selector._id in this.ids;
    }
    if (typeof selector._id === 'object' && selector._id.hasOwnProperty('$in')) {
      return selector._id['$in'].reduce((result: boolean, id: string) => {
        return result && id in this.ids;
      }, true);
    }
    return false;
  }
}
