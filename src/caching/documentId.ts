import {CacheEvaluator, QueryOptions} from '../interfaces';
import {isString} from 'lodash';

export class DocumentIdEvaluator implements CacheEvaluator {
  private ids: {[id: string]: boolean} = {};

  public isCached(selector: any, options: QueryOptions): boolean {
    return selector._id && isString(selector._id) && selector._id in this.ids;
  }

  public setCached(selector: any, options: QueryOptions) { return; }

  public add(doc: any) {
    this.ids[doc._id] = true;
  }

  public optimizeQuery(selector: any, options: QueryOptions): any {
    return {selector: selector, options: options};
  }
}
