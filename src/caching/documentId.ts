import {CacheEvaluator, QueryOptions} from '../interfaces';
import {isString, isObject, each} from 'lodash';

export class DocumentIdEvaluator implements CacheEvaluator {
  private ids: {[id: string]: boolean} = {};

  public isCached(selector: any, options: QueryOptions): boolean {
    if (!selector.hasOwnProperty('_id')) {
      return false;
    }
    if (isString(selector._id)) {
      return selector._id in this.ids;
    }
    if (isObject(selector._id) && selector._id.hasOwnProperty('$in')) {
      for (let id of selector._id['$in']) {
        if (!(id in this.ids)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  public setCached(selector: any, options: QueryOptions) { return; }

  public add(doc: any) {
    this.ids[doc._id] = true;
  }

  public optimizeQuery(selector: any, options: QueryOptions): void {
    return;
  }

  public invalidate(): void {
    this.ids = {};
  }
}
