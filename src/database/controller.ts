import {injectable, decorate} from '@ziggurat/tiamat';
import {Processor} from '@ziggurat/ningal';
import {Collection, DocumentError, QueryOptions, CacheEvaluator} from '../interfaces';
import {Document} from '../models/document';
import {QueryHashEvaluator} from '../caching/queryHash';
import {EventEmitter} from 'eventemitter3';
import {clone, map, pull, some} from 'lodash';

if (Reflect.hasOwnMetadata('inversify:paramtypes', EventEmitter) === false) {
  decorate(injectable(), EventEmitter);
}

@injectable()
export class Controller extends EventEmitter implements Collection {
  public locked = false;
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private processor: Processor;
  private synced = false;
  private populating = false;
  private upsertQueue: string[] = [];
  private cacheEvaluators: CacheEvaluator[] = [];
  private countCacheEvaluator: CacheEvaluator = new QueryHashEvaluator();
  private populatePromise: Promise<void>;

  public constructor() {
    super();
  }

  get buffer(): Collection {
    return this._buffer;
  }

  get cache(): Collection {
    return this._cache;
  }

  get source(): Collection {
    return this._source;
  }

  public setBuffer(buffer: Collection): void {
    this._buffer = buffer;
  }

  public setCache(cache: Collection): void {
    cache.on('document-upserted', (doc: Document) => {
      this.emit('document-upserted', doc);
    });
    cache.on('document-removed', (doc: Document) => {
      this.emit('document-removed', doc);
    });

    this._cache = cache;
  }

  public setSource(source: Collection): void {
    this._source = source;

    source.on('document-upserted', (doc: Document) => {
      if (!this.populating && !this.locked) {
        doc._collection = this.name();
        if (this.upsertQueue.indexOf(doc._id) < 0) {
          this.processor.process(doc, 'source-upsert');
        }
      }
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });
  }

  public setProcessor(processor: Processor) {
    this.processor = processor;
  }

  public async _populate(): Promise<void> {
    for (let doc of await this.populateBuffer(await this._source.find())) {
      try {
        await this.processor.process(doc, 'populate-post-buffer');
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    this.synced = true;
    this.populating = false;
    this.locked = false;
    this.emit('ready');
  }

  public populate(): Promise<void> {
    if (!this.populatePromise && this._source) {
      this.populating = true;
      this.populatePromise = this._populate();
    }
    return this.populatePromise;
  }

  public addCacheEvaluator(evaluator: CacheEvaluator): void {
    this.cacheEvaluators.push(evaluator);
  }

  public async find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.populating) {
      await this.populatePromise;
    } else if (!this.isCached(selector, options)) {
      let optQuery = this.optimizeQuery(selector, options);

      for (let doc of await this._source.find<T>(optQuery.selector, optQuery.options)) {
        await this.upsertCache<T>(doc);
      }
      this.setCached(selector, options);
    }
    return this._cache.find<T>(selector, options);
  }

  public async findOne<T extends Document>(selector: Object): Promise<T> {
    try {
      return await this._cache.findOne<T>(selector);
    } catch (err) {
      if (!this.populating) {
        return this.upsertCache<T>(await this._source.findOne<T>(selector));
      } else {
        throw err;
      }
    }
  }

  public async upsert<T extends Document>(doc: T): Promise<T> {
    if (this.locked) {
      throw new Error('Failed to upsert in locked controller');
    }

    let copy = clone(doc);
    copy._revision = doc._revision ? doc._revision + 1 : 1;
    copy._collection = this.name();

    this.upsertQueue.push(copy._id);

    await this.processor.process(copy, 'upsert');
    pull(this.upsertQueue, copy._id);
    return Promise.resolve(copy);
  }

  public async remove(selector: Object): Promise<void> {
    await this._source.remove(selector);
    return this._cache.remove(selector);
  }

  public count(selector?: Object): Promise<number> {
    if (this.isCached(selector) || this.countCacheEvaluator.isCached(selector, {})) {
      return this._cache.count(selector);
    }
    return this._source.count(selector);
  }

  public name(): string {
    return this._cache.name();
  }

  private async upsertCache<T extends Document>(doc: T): Promise<T> {
    let cachedDoc = await this.processor.process(doc, 'cache');
    this.cacheEvaluators.forEach((ce: CacheEvaluator) => {
      ce.add(cachedDoc);
    });
    return cachedDoc;
  }

  private isCached(selector?: Object, options?: QueryOptions): boolean {
    return this.synced || some(this.cacheEvaluators, (ce: CacheEvaluator) => {
      return ce.isCached(selector || {}, options || {});
    });
  }

  private setCached(selector?: Object, options?: QueryOptions) {
    this.cacheEvaluators.forEach((ce: CacheEvaluator) => {
      ce.setCached(selector || {}, options || {});
    });
    this.countCacheEvaluator.setCached(selector, {});
  }

  private optimizeQuery(selector?: Object, options?: QueryOptions): any {
    let query = {selector: selector, options: options};

    this.cacheEvaluators.forEach((ce: CacheEvaluator) => {
      query = ce.optimizeQuery(query.selector || {}, query.options || {});
    });
    return query;
  }

  private async populateBuffer(docs: Document[]): Promise<Document[]> {
    for (let doc of docs) {
      doc._collection = this.name();
      try {
        await this._buffer.upsert(await this.processor.process(doc, 'populate-pre-buffer'));
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    return this._buffer.find();
  }
}
