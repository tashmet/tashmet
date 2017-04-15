import {injectable} from '@samizdatjs/tiamat';
import {Collection, DocumentError, Pipe} from '../interfaces';
import {Pipeline, DocumentPipe, HookablePipeline, UpsertPipe,
  Validator, MergeDefaults, StripDefaults, BufferPipe} from '../pipes';
import {DocumentController} from './document';
import {Controller} from './controller';
import {CollectionConfig} from './meta/decorators';
import {pull} from 'lodash';


@injectable()
export class CollectionController extends Controller implements Collection {
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private cachePipe: UpsertPipe = new UpsertPipe();
  private bufferPipe: BufferPipe = new BufferPipe();
  private persistPipe: UpsertPipe = new UpsertPipe();
  private documentInputPipe: DocumentPipe = new DocumentPipe('input');
  private documentOutputPipe: DocumentPipe = new DocumentPipe('output');
  private ready = false;
  private synced = false;
  private upsertQueue: string[] = [];
  private cachedQueries: {[query: string]: boolean} = {};

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

    this.pipes['populate'] = new HookablePipeline(true)
      .step('validate', new Validator(schemas))
      .step('merge',    new MergeDefaults(schemas))
      .push(this.documentInputPipe)
      .step('buffer',   this.bufferPipe)
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
    this.bufferPipe.setCollection(buffer);
  }

  public setCache(cache: Collection): void {
    const events = [
      'document-upserted',
      'document-removed'
    ];
    events.forEach((event: string) => {
      cache.on(event, (obj: any) => {
        this.emit(event, obj);
      });
    });
    this._cache = cache;
    this.cachePipe.setCollection(cache);

    let cacheCount = 0;
    cache.on('document-upserted', (doc: any) => {
      if (!this.ready) {
        cacheCount += 1;
        if (cacheCount >= this.bufferPipe.getCount()) {
          this.ready = true;
          this.synced = true;
          this.emit('ready');
        }
      }
    });
  }

  public setSource(source: Collection): void {
    this._source = source;
    this.persistPipe.setCollection(source);

    source.on('document-upserted', (doc: any) => {
      if (this.upsertQueue.indexOf(doc._id) < 0) {
        this.pipes['source-upsert'].process(doc, (output: any) => { return; });
      }
    });
    source.on('document-removed', (id: string) => {
      // TODO: Remove document from collection.
    });

    this.pipes['populate'].on('document-error', (err: DocumentError) => {
      this.bufferPipe.decCount();
    });
  }

  public populate(): void {
    this._source.find({}, {}).then((docs: any[]) => {
      this.bufferPipe.setCount(Object.keys(docs).length);
      docs.forEach((doc: any) => {
        this.pipes['populate'].process(doc, (output: any) => { return; });
      });
    });
  }

  public addDocumentController(doc: DocumentController): void {
    this.documentInputPipe.addController(doc);
    this.documentOutputPipe.addController(doc);
  }

  public find(selector: Object, options: Object): Promise<any> {
    if (this.synced || JSON.stringify(selector) in this.cachedQueries) {
      return this._cache.find(selector, options);
    }
    return new Promise((resolve) => {
      this._source.find(selector, options)
        .then((result: any[]) => {
          result.forEach((doc: any) => {
            this._cache.upsert(doc);
          });
          this.cachedQueries[JSON.stringify(selector)] = true;
          resolve(result);
        });
    });
  }

  public findOne(selector: Object, options: Object): Promise<any> {
    return new Promise((resolve) => {
      this._cache.findOne(selector, options).then((cachedDoc: any) => {
        if (cachedDoc) {
          resolve(cachedDoc);
        } else {
          this._source.findOne(selector, options)
            .then((doc: any) => {
              if (doc) {
                this._cache.upsert(doc);
                this.cachedQueries[JSON.stringify(selector)] = true;
              }
              resolve(doc);
            });
        }
      });
    });
  }

  public upsert(obj: any): Promise<any> {
    this.upsertQueue.push(obj._id);
    return new Promise((resolve) => {
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
}
