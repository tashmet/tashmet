import {injectable, decorate} from '@ziggurat/tiamat';
import {Processor} from '@ziggurat/ningal';
import {Collection, DocumentError, QueryOptions, CacheEvaluator} from '../interfaces';
import {CacheCollection} from '../collections/cache';
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
  protected _cache: CacheCollection;
  protected _buffer: Collection;
  protected _source: Collection;
  private processor: Processor;
  private populating = false;
  private upsertQueue: string[] = [];
  private populatePromise: Promise<void>;

  public constructor() {
    super();
  }

  get buffer(): Collection {
    return this._buffer;
  }

  get cache(): Collection {
    return this._cache.collection;
  }

  get source(): Collection {
    return this._source;
  }

  public setBuffer(buffer: Collection): void {
    this._buffer = buffer;
  }

  public setCache(cache: CacheCollection): void {
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

  public populate(): Promise<void> {
    if (!this.populatePromise && this._source) {
      this.populating = true;
      this.populatePromise = this._populate();
    }
    return this.populatePromise;
  }

  public async find<T extends Document>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.populating) {
      await this.populatePromise;
    }
    try {
      return await this._cache.find<T>(selector, options);
    } catch (err) {
      let cachedDocs = [];
      for (let doc of await this._source.find<T>(err.selector, err.options)) {
        cachedDocs.push(await this.processor.process(doc, 'cache'));
      }
      this._cache.setCached(selector, options);
      return cachedDocs;
    }
  }

  public async findOne<T extends Document>(selector: Object): Promise<T> {
    try {
      return await this._cache.findOne<T>(selector);
    } catch (err) {
      if (this.populating) {
        throw err;
      } else {
        return this.processor.process(await this._source.findOne<T>(selector), 'cache');
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
    if (this.populating) {
      await this.populatePromise;
    }
    await this._source.remove(selector);
    return this._cache.remove(selector);
  }

  public async count(selector?: Object): Promise<number> {
    try {
      return await this._cache.count();
    } catch (err) {
      return this._source.count();
    }
  }

  public name(): string {
    return this._cache.name();
  }

  private async _populate(): Promise<void> {
    for (let doc of await this.populateBuffer(await this._source.find())) {
      try {
        await this.processor.process(doc, 'populate-post-buffer');
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    this.populating = false;
    this.locked = false;
    this.emit('ready');
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
