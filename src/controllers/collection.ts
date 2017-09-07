import {injectable} from '@ziggurat/tiamat';
import {Collection, DocumentError, Pipe, QueryOptions, CacheEvaluator} from '../interfaces';
import {Document} from '../models/document';
import {QueryHashEvaluator} from '../database/cache/queryHash';
import {Pipeline, HookablePipeline, UpsertPipe, RevisionUpsertPipe,
  Validator, MergeDefaults, StripDefaults} from '../pipes';
import {Controller} from './controller';
import {CollectionConfig} from './meta/decorators';
import {clone, map, pull, some} from 'lodash';
import * as Promise from 'bluebird';

@injectable()
export class CollectionController extends Controller implements Collection {
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private cachePipe: RevisionUpsertPipe = new RevisionUpsertPipe();
  private persistPipe: UpsertPipe = new UpsertPipe();
  private synced = false;
  private populating = false;
  private upsertQueue: string[] = [];
  private cacheEvaluators: CacheEvaluator[] = [];
  private countCacheEvaluator: CacheEvaluator = new QueryHashEvaluator();
  private populatePromise: Promise<void>;

  public constructor() {
    super();
    let config: CollectionConfig = this.getMetaData(this.constructor);
    let schemas = Reflect.getMetadata('isimud:schemas', this.constructor);

    this.pipes['source-upsert'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['upsert'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .step('cache',    this.cachePipe)
      .step('strip',    new StripDefaults(schemas))
      .step('persist',  this.persistPipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['populate-pre-buffer'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['populate-post-buffer'] = new HookablePipeline(true)
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.addHooks(this);
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
    this.cachePipe.setCollection(cache);
  }

  public setSource(source: Collection): void {
    this._source = source;
    this.persistPipe.setCollection(source);

    source.on('document-upserted', (doc: Document) => {
      doc._collection = this.name();
      if (this.upsertQueue.indexOf(doc._id) < 0) {
        this.pipes['source-upsert'].process(doc);
      }
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });
  }

  public populate(): Promise<void> {
    if (!this.populatePromise && this._source) {
      this.populating = true;
      this.populatePromise = new Promise<void>((resolve) => {
        this._source.find()
          .then((docs: Document[]) => {
            return this.populateBuffer(docs);
          })
          .then(() => {
            return this._buffer.find();
          })
          .then((bufferedDocs: Document[]) => {
            return Promise.each(bufferedDocs, (doc: Document) => {
              return this.pipes['populate-post-buffer'].process(doc);
            });
          })
          .then(() => {
            this.synced = true;
            this.populating = false;
            this.emit('ready');
            resolve();
          });
      });
    }
    return this.populatePromise;
  }

  public addCacheEvaluator(evaluator: CacheEvaluator): void {
    this.cacheEvaluators.push(evaluator);
  }

  public find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.isCached(selector, options)) {
      return this._cache.find(selector, options);
    }
    let optQuery = this.optimizeQuery(selector, options);
    return this._source.find(optQuery.selector, optQuery.options)
      .then((documents: Document[]) => {
        let cachePromises = map(documents, (doc: Document) => {
          return this.upsertCache(doc);
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        this.setCached(selector, options);
        return this._cache.find(selector, options);
      });
  }

  public findOne<T extends Document>(selector: Object): Promise<T> {
    return this._cache.findOne<T>(selector)
      .then((cachedDoc: T) => {
        return Promise.resolve(cachedDoc);
      })
      .catch((error: any) => {
        if (!this.populating) {
          return this._source.findOne(selector);
        }
        return Promise.reject(error);
      })
      .then((doc: T) => {
        this.upsertCache(doc);
        return Promise.resolve(doc);
      });
  }

  public upsert<T extends Document>(doc: T): Promise<T> {
    let copy = clone(doc);
    copy._revision = doc._revision ? doc._revision + 1 : 1;
    copy._collection = this.name();

    this.upsertQueue.push(copy._id);

    return this.pipes['upsert'].process(copy)
      .then((output: Document) => {
        pull(this.upsertQueue, copy._id);
        return Promise.resolve(copy);
      });
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

  private upsertCache(doc: Document): Promise<Document> {
    return this.cachePipe.process(doc).then((cachedDoc: Document) => {
      this.cacheEvaluators.forEach((ce: CacheEvaluator) => {
        ce.add(cachedDoc);
      });
      return Promise.resolve(cachedDoc);
    });
  }

  private getMetaData(constructor: any): CollectionConfig {
    return Reflect.getOwnMetadata('isimud:collection', constructor);
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

  private populateBuffer(docs: Document[]): Promise<any> {
    return Promise.each(docs, (doc: Document) => {
      doc._collection = this.name();
      return this.pipes['populate-pre-buffer'].process(doc)
        .then((output: Document) => {
          return this._buffer.upsert(output);
        })
        .catch((err: Error) => {
          Promise.resolve();
        });
    });
  }
}
