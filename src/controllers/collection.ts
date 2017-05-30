import {injectable} from '@samizdatjs/tiamat';
import {Collection, DocumentError, Pipe, QueryOptions} from '../interfaces';
import {Pipeline, DocumentPipe, HookablePipeline, UpsertPipe,
  Validator, MergeDefaults, StripDefaults} from '../pipes';
import {DocumentController} from './document';
import {Controller} from './controller';
import {CollectionConfig} from './meta/decorators';
import {pull} from 'lodash';
import * as Promise from 'bluebird';

@injectable()
export class CollectionController extends Controller implements Collection {
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private cachePipe: UpsertPipe = new UpsertPipe();
  private persistPipe: UpsertPipe = new UpsertPipe();
  private documentInputPipe: DocumentPipe = new DocumentPipe('input');
  private documentOutputPipe: DocumentPipe = new DocumentPipe('output');
  private synced = false;
  private populating = false;
  private upsertQueue: string[] = [];
  private cachedQueries: {[query: string]: boolean} = {};
  private populatePromise: Promise<Collection>;

  public constructor() {
    super();
    let config: CollectionConfig = this.getMetaData(this.constructor);
    let schemas = Reflect.getMetadata('tashmetu:schemas', this.constructor);

    this.pipes['source-upsert'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .push(this.documentInputPipe)
      .step('cache',    this.cachePipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['upsert'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .push(this.documentInputPipe)
      .step('cache',    this.cachePipe)
      .step('strip',    new StripDefaults(schemas))
      .push(this.documentOutputPipe)
      .step('persist',  this.persistPipe)
      .on('document-error', (err: DocumentError) => {
        this.emit('document-error', err);
      });

    this.pipes['populate-pre-buffer'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .push(this.documentInputPipe)
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
    if (!this.populatePromise) {
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

  public addDocumentController(doc: DocumentController): void {
    this.documentInputPipe.addController(doc);
    this.documentOutputPipe.addController(doc);
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    let queryHash = this.queryHash(selector, options);
    let hasOptions = options && Object.keys(options).length > 0;
    if (this.synced || (!hasOptions && queryHash in this.cachedQueries)) {
      return this._cache.find(selector, options);
    }
    return this._source.find(selector, options)
      .then((result: any[]) => {
        result.forEach((doc: any) => {
          this._cache.upsert(doc);
        });
        if (!hasOptions) {
          this.cachedQueries[queryHash] = true;
        }
        return Promise.resolve(result);
      });
  }

  public findOne(selector: Object): Promise<any> {
    return new Promise((resolve, reject) => {
      this._cache.findOne(selector)
        .then((cachedDoc: any) => {
          resolve(cachedDoc);
        })
        .catch((error: any) => {
          if (!this.populating) {
            return this._source.findOne(selector);
          }
          reject(error);
        })
        .then((doc: any) => {
          this._cache.upsert(doc);
          this.cachedQueries[this.queryHash(selector)] = true;
          resolve(doc);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  public upsert(obj: any): Promise<any> {
    this.upsertQueue.push(obj._id);
    obj._collection = this.name();
    return this.pipes['upsert'].process(obj)
      .then((output: any) => {
        pull(this.upsertQueue, obj._id);
        return Promise.resolve(obj);
      });
  }

  public name(): string {
    return this._cache.name();
  }

  private getMetaData(constructor: any): CollectionConfig {
    return Reflect.getOwnMetadata('tashmetu:collection', constructor);
  }

  private queryHash(selector?: Object, options?: QueryOptions): string {
    return JSON.stringify(selector || {}) + JSON.stringify(options || {});
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
