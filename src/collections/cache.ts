import {Collection, QueryOptions, CacheEvaluator} from '../interfaces';
import {QueryHashEvaluator} from '../caching/queryHash';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {some} from 'lodash';

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
  private countEvaluator: CacheEvaluator = new QueryHashEvaluator();

  public constructor(
    public collection: Collection,
    public evaluators: CacheEvaluator[] = []
  ) {
    super();
    collection.on('document-upserted', (doc: Document) => {
      this.emit('document-upserted', doc);
    });
    collection.on('document-removed', (doc: Document) => {
      this.emit('document-removed', doc);
    });
  }

  public find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.isCached(selector, options)) {
      return this.collection.find(selector, options);
    } else {
      selector = selector || {};
      options = options || {};
      for (let evaluator of this.evaluators) {
        evaluator.optimizeQuery(selector, options);
      }
      return Promise.reject(new CacheFindError(selector, options));
    }
  }

  public findOne<T extends Document>(selector: Object): Promise<T> {
    return this.collection.findOne(selector);
  }

  public upsert<T extends Document>(doc: T): Promise<T> {
    for (let evaluator of this.evaluators) {
      evaluator.add(doc);
    }
    return this.collection.upsert(doc);
  }

  public remove(selector: Object): Promise<void> {
    for (let evaluator of this.evaluators) {
      evaluator.invalidate();
    }
    this.countEvaluator.invalidate();
    return this.collection.remove(selector);
  }

  public count(selector?: Object): Promise<number> {
    if (this.isCached(selector) || this.countEvaluator.isCached(selector, {})) {
      return this.collection.count(selector);
    } else {
      return Promise.reject(new Error('Count is not cached'));
    }
  }

  public name(): string {
    return this.collection.name();
  }

  public setCached(selector?: Object, options?: QueryOptions) {
    this.evaluators.forEach((ce: CacheEvaluator) => {
      ce.setCached(selector || {}, options || {});
    });
    this.countEvaluator.setCached(selector, {});
  }

  private isCached(selector?: Object, options?: QueryOptions): boolean {
    return this.synced || some(this.evaluators, (evaluator: CacheEvaluator) => {
      return evaluator.isCached(selector || {}, options || {});
    });
  }
}
