import {injectable} from '@ziggurat/tiamat';
import {Collection, DocumentError, Pipe, QueryOptions, CacheEvaluator} from '../interfaces';
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
  private populatePromise: Promise<Collection>;

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
    cache.on('document-upserted', (obj: any) => {
      this.emit('document-upserted', obj);
    });
    cache.on('document-removed', (obj: any) => {
      this.emit('document-removed', obj);
    });

    this._cache = cache;
    this.cachePipe.setCollection(cache);
  }

  public setSource(source: Collection): void {
    this._source = source;
    this.persistPipe.setCollection(source);

    source.on('document-upserted', (doc: any) => {
      doc._collection = this.name();
      if (this.upsertQueue.indexOf(doc._id) < 0) {
        this.pipes['source-upsert'].process(doc);
      }
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });
  }

  public populate(): Promise<Collection> {
    if (!this.populatePromise && this._source) {
      this.populating = true;
      this.populatePromise = new Promise<Collection>((resolve) => {
        this._source.find()
          .then((docs: any[]) => {
            return this.populateBuffer(docs);
          })
          .then(() => {
            return this._buffer.find();
          })
          .then((bufferedDocs: any[]) => {
            return Promise.each(bufferedDocs, (doc: any) => {
              return this.pipes['populate-post-buffer'].process(doc);
            });
          })
          .then(() => {
            this.synced = true;
            this.populating = false;
            this.emit('ready');
            resolve(this);
          });
      });
    }
    return this.populatePromise;
  }

  public addCacheEvaluator(evaluator: CacheEvaluator): void {
    this.cacheEvaluators.push(evaluator);
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    if (this.isCached(selector, options)) {
      return this._cache.find(selector, options);
    }
    let optQuery = this.optimizeQuery(selector, options);
    return this._source.find(optQuery.selector, optQuery.options)
      .then((documents: any[]) => {
        let cachePromises = map(documents, (doc: any) => {
          return this.upsertCache(doc);
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        this.setCached(selector, options);
        return this._cache.find(selector, options);
      });
  }

  public findOne(selector: Object): Promise<any> {
    return this._cache.findOne(selector)
      .then((cachedDoc: any) => {
        return Promise.resolve(cachedDoc);
      })
      .catch((error: any) => {
        if (!this.populating) {
          return this._source.findOne(selector);
        }
        return Promise.reject(error);
      })
      .then((doc: any) => {
        this.upsertCache(doc);
        return Promise.resolve(doc);
      });
  }

  public upsert(obj: any): Promise<any> {
    let copy = clone(obj);
    copy._revision = obj._revision ? obj._revision + 1 : 1;
    copy._collection = this.name();

    this.upsertQueue.push(copy._id);

    return this.pipes['upsert'].process(copy)
      .then((output: any) => {
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

  private upsertCache(doc: any): Promise<any> {
    return this.cachePipe.process(doc).then((cachedDoc: any) => {
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

  private populateBuffer(docs: any[]): Promise<any> {
    return Promise.each(docs, (doc: any) => {
      doc._collection = this.name();
      return this.pipes['populate-pre-buffer'].process(doc)
        .then((output: any) => {
          return this._buffer.upsert(output);
        })
        .catch((err: Error) => {
          Promise.resolve();
        });
    });
  }
}
