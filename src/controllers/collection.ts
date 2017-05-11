import {injectable} from '@samizdatjs/tiamat';
import {Collection, DocumentError, Pipe, QueryOptions} from '../interfaces';
import {Pipeline, DocumentPipe, HookablePipeline, UpsertPipe,
  Validator, MergeDefaults, StripDefaults} from '../pipes';
import {DocumentController} from './document';
import {Controller} from './controller';
import {CollectionConfig} from './meta/decorators';
import {pull} from 'lodash';

let eachSeries = require('async-each-series');


@injectable()
export class CollectionController extends Controller implements Collection {
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private cachePipe: UpsertPipe = new UpsertPipe();
  private persistPipe: UpsertPipe = new UpsertPipe();
  private documentInputPipe: DocumentPipe = new DocumentPipe('input');
  private documentOutputPipe: DocumentPipe = new DocumentPipe('output');
  private ready = false;
  private synced = false;
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
        this.pipes['source-upsert'].process(doc, (output: any) => { return; });
      }
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });
  }

  public populate(): Promise<Collection> {
    if (!this.populatePromise) {
      this.populatePromise = new Promise((resolve) => {
        this._source.find()
          .then((docs: any[]) => {
            return this.populateBuffer(docs);
          })
          .then((buffer: Collection) => {
            return buffer.find();
          })
          .then((bufferedDocs: any[]) => {
            eachSeries(bufferedDocs, (bufferedDoc: any, done: any) => {
              this.pipes['populate-post-buffer'].process(bufferedDoc, (output: any) => {
                done();
              });
            }, (err: any) => {
              this.ready = true;
              this.synced = true;
              this.emit('ready');
              resolve(this);
            });
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
    if (this.synced || (!options && queryHash in this.cachedQueries)) {
      return this._cache.find(selector, options);
    }
    return new Promise((resolve) => {
      this._source.find(selector, options)
        .then((result: any[]) => {
          result.forEach((doc: any) => {
            this._cache.upsert(doc);
          });
          if (!options) {
            this.cachedQueries[queryHash] = true;
          }
          resolve(result);
        });
    });
  }

  public findOne(selector: Object): Promise<any> {
    return new Promise((resolve, reject) => {
      this._cache.findOne(selector)
        .then((cachedDoc: any) => {
          resolve(cachedDoc);
        })
        .catch((error: any) => {
          return this._source.findOne(selector);
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
    return new Promise((resolve) => {
      obj._collection = this.name();
      this.pipes['upsert'].process(obj, (output: any) => {
        pull(this.upsertQueue, obj._id);
        resolve(obj);
      });
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

  private populateBuffer(docs: any[]): Promise<Collection> {
    return new Promise((resolve, reject) => {
      eachSeries(docs, (doc: any, done: any) => {
        doc._collection = this.name();
        this.pipes['populate-pre-buffer'].process(doc, (output: any) => {
          if (output.name === 'DocumentError') {
            return done();
          }
          this._buffer.upsert(output).then(() => {
            done();
          });
        });
      }, (err: any) => {
        resolve(this._buffer);
      });
    });
  }
}
