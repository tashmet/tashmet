import {injectable, decorate, Newable} from '@ziggurat/tiamat';
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
export class Controller<U extends Document = Document>
  extends EventEmitter implements Collection<U>
{
  public readonly model: Newable<U>;
  public locked = true;
  protected _cache: CacheCollection;
  protected _buffer: Collection;
  protected _source: Collection;
  private processor: Processor<U>;
  private upsertQueue: string[] = [];
  private populatePromise: Promise<void>;
  private _name: string;

  get name(): string {
    return this._name;
  }

  get buffer(): Collection<U> {
    return this._buffer;
  }

  get cache(): Collection<U> {
    return this._cache.collection;
  }

  get source(): Collection<U> {
    return this._source;
  }

  public initialize(name: string,
    source: Collection, cache: CacheCollection, buffer: Collection, processor: Processor<U>)
  {
    this._name = name;
    this._source = source;
    this._cache = cache;
    this._buffer = buffer;
    this.processor = processor;

    cache.on('document-upserted', (doc: U) => {
      this.emit('document-upserted', doc);
    });
    cache.on('document-removed', (doc: U) => {
      this.emit('document-removed', doc);
    });

    source.on('document-upserted', (doc: U) => {
      if (!this.locked) {
        doc._collection = this.name;
        if (this.upsertQueue.indexOf(doc._id) < 0) {
          this.processor.process(doc, 'source-upsert');
        }
      }
    });
    source.on('document-removed', (doc: U) => {
      this._cache.remove({_id: doc._id});
    });
  }

  public populate(): Promise<void> {
    if (!this.populatePromise && this._source) {
      this.locked = true;
      this.populatePromise = this._populate();
    }
    return this.populatePromise;
  }

  public async find<T extends U>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    if (this.locked) {
      await this.populatePromise;
    }
    try {
      return await this._cache.find<T>(selector, options);
    } catch (err) {
      for (let doc of await this._source.find<T>(err.selector, err.options)) {
        await this.processor.process(doc, 'cache');
      }
      this._cache.setCached(selector, options);
      return this._cache.find<T>(selector, options);
    }
  }

  public async findOne<T extends U>(selector: Object): Promise<T> {
    try {
      return await this._cache.findOne<T>(selector);
    } catch (err) {
      if (this.locked) {
        throw err;
      } else {
        return <Promise<T>>this.processor.process(await this._source.findOne<T>(selector), 'cache');
      }
    }
  }

  public async upsert<T extends U>(doc: T): Promise<T> {
    if (this.locked) {
      throw new Error('Cannot upsert while populating collection');
    }

    let copy = clone(doc);
    copy._revision = doc._revision ? doc._revision + 1 : 1;
    copy._collection = this.name;

    this.upsertQueue.push(copy._id);

    await this.processor.process(copy, 'upsert');
    pull(this.upsertQueue, copy._id);
    return Promise.resolve(copy);
  }

  public async remove<T extends U>(selector: Object): Promise<T[]> {
    if (this.locked) {
      await this.populatePromise;
    }
    let affected = await this._source.find<T>(selector);
    for (let doc of affected) {
      await this.processor.process(doc, 'unpersist');
    }
    for (let doc of await this._cache.collection.find<T>(selector)) {
      await this.processor.process(doc, 'uncache');
    }
    return affected;
  }

  public async count(selector?: Object): Promise<number> {
    try {
      return await this._cache.count(selector);
    } catch (err) {
      return this._source.count(selector);
    }
  }

  private async _populate(): Promise<void> {
    for (let doc of await this.populateBuffer(await this._source.find<U>())) {
      try {
        await this.processor.process(doc, 'populate-post-buffer');
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    this.locked = false;
    this._cache.synced = true;
    this.emit('ready');
  }

  private async populateBuffer(docs: U[]): Promise<U[]> {
    for (let doc of docs) {
      doc._collection = this.name;
      try {
        await this._buffer.upsert(await this.processor.process(doc, 'populate-pre-buffer'));
      } catch (err) {
        this.emit('document-error', err);
      }
    }
    return this._buffer.find<U>();
  }
}
