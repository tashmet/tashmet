import {Collection, QueryOptions, CacheEvaluator} from '../interfaces';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {each, some} from 'lodash';

export class CacheFindError extends Error {
  public constructor(
    public selector: Object,
    public options: QueryOptions
  ) {
    super();
  }
}

export class CacheCollection extends EventEmitter implements Collection {
  public synced = false;

  public constructor(
    public collection: Collection,
    public evaluators: CacheEvaluator[] = []
  ) {
    super();
    collection.on('document-upserted', (doc: Document) => {
      each(this.evaluators, e => e.add(doc));
      this.emit('document-upserted', doc);
    });
    collection.on('document-removed', (doc: Document) => {
      this.emit('document-removed', doc);
    });
  }

  public find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.isCached(selector, options)) {
      return this.collection.find<T>(selector, options);
    } else {
      let selectorOpt = Object.assign({}, selector);
      let optionsOpt = Object.assign({}, options);
      each(this.evaluators, e => e.optimizeQuery(selectorOpt, optionsOpt));
      return Promise.reject(new CacheFindError(selectorOpt, optionsOpt));
    }
  }

  public findOne<T extends Document>(selector: Object): Promise<T> {
    return this.collection.findOne(selector);
  }

  public upsert<T extends Document>(doc: T): Promise<T> {
    return this.collection.upsert(doc);
  }

  public remove(selector: Object): Promise<void> {
    each(this.evaluators, e => e.invalidate());
    return this.collection.remove(selector);
  }

  public count(selector?: Object): Promise<number> {
    if (this.isCached(selector)) {
      return this.collection.count(selector);
    } else {
      return Promise.reject(new Error('Count is not cached'));
    }
  }

  public name(): string {
    return this.collection.name();
  }

  public setCached(selector?: Object, options?: QueryOptions) {
    each(this.evaluators, e => e.setCached(selector || {}, options || {}));
  }

  private isCached(selector?: Object, options?: QueryOptions): boolean {
    return this.synced || some(this.evaluators, e => {
      return e.isCached(selector || {}, options || {});
    });
  }
}
