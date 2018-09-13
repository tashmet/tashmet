import {Newable} from '@ziggurat/meta';
import {injectable, decorate} from '@ziggurat/tiamat';
import {Processor, Sequence} from '@ziggurat/ningal';
import {Validator} from '@ziggurat/mushdamma';
import {Collection, QueryOptions, Query} from '../interfaces';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {clone, find, pull} from 'lodash';
import {RevisionUpsertPipe} from '../pipes/upsert';
import {ValidationPipe} from '../pipes/validation';
import {FindPipe, FindOnePipe} from '../pipes/find';
import {PopulatePipe} from '../pipes/populate';
import {RemovePipe} from '../pipes/remove';

if (Reflect.hasOwnMetadata('inversify:paramtypes', EventEmitter) === false) {
  decorate(injectable(), EventEmitter);
}

@injectable()
export class Controller<U extends Document = Document>
  extends EventEmitter implements Collection<U>
{
  public readonly model: Newable<U>;
  public locked = true;
  protected _cache: Collection;
  protected _buffer: Collection;
  protected _source: Collection;
  private upsertQueue: string[] = [];
  private populatePromise: Promise<U[]>;
  private removePromise: Promise<Document[]> | undefined;
  private _name: string;
  private findPipe: (q: Query) => Promise<Document[]>;
  private findOnePipe: (selector: object) => Promise<Document>;
  private removePipe: (selector: object) => Promise<Document[]>;
  private populatePipe: (selector: object) => Promise<Document[]>;
  private upsertPipe: (doc: Document) => Promise<Document>;

  get name(): string {
    return this._name;
  }

  get buffer(): Collection<U> {
    return this._buffer;
  }

  get cache(): Collection<U> {
    return this._cache;
  }

  get source(): Collection<U> {
    return this._source;
  }

  public initialize(name: string,
    source: Collection, cache: Collection, buffer: Collection, processor: Processor, validator: Validator)
  {
    this._name = name;
    this._source = source;
    this._cache = cache;
    this._buffer = buffer;

    let cachePipe = new RevisionUpsertPipe(cache);
    let validationPipe = new ValidationPipe(validator);

    this.findPipe = processor.pipe<Query, Document[]>('find', new FindPipe(
      source, cache, cachePipe, validationPipe
    ));
    this.findOnePipe = processor.pipe<object, Document>('find-one', new FindOnePipe(
      source, cache, cachePipe, validationPipe
    ));
    this.removePipe = processor.pipe<object, Document[]>('remove', new RemovePipe(
      source, cache
    ));
    this.populatePipe = processor.pipe<object, Document[]>('populate', new PopulatePipe(
      this.name, source, buffer, cachePipe, validationPipe
    ));
    this.upsertPipe = processor.pipe<Document>('upsert', new Sequence({
      'validate': validationPipe,
      'cache': cachePipe,
      'persist': (doc: Document) => source.upsert(doc)
    }));

    const sourceUpsertPipe = processor.pipe<Document>('source-upsert', new Sequence({
      'validate': validationPipe,
      'cache': cachePipe
    }));
    const sourceRemovePipe = processor.pipe<object, Document[]>('source-remove', new Sequence({
      'uncache': async (selector: object) => this.cache.remove(selector)
    }));

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
          sourceUpsertPipe(doc);
        }
      }
    });
    source.on('document-removed', (doc: U) => {
      this.await(this.removePromise, (res: Document[] | undefined) => {
        if (!res || !find(res, {_id: doc._id})) {
          sourceRemovePipe({_id: doc._id});
        }
      });
    });
  }

  public populate(): Promise<U[]> {
    if (!this.populatePromise && this._source) {
      this.locked = true;
      this.populatePromise = <Promise<U[]>>this.populatePipe({}).then(docs => {
        this.locked = false;
        this.emit('ready');
        return docs;
      });
    }
    return this.populatePromise;
  }

  public async find<T extends U>(selector?: Object, options?: QueryOptions): Promise<T[]> {
    return <Promise<T[]>>this.findPipe({selector: selector || {}, options: options || {}});
  }

  public async findOne<T extends U>(selector: Object): Promise<T> {
    return <Promise<T>>this.findOnePipe(selector);
  }

  public async upsert<T extends U>(doc: T): Promise<T> {
    let copy = clone(doc);
    copy._revision = doc._revision ? doc._revision + 1 : 1;
    copy._collection = this.name;

    this.upsertQueue.push(copy._id);

    copy = <T>(await this.upsertPipe(copy));
    pull(this.upsertQueue, copy._id);
    return Promise.resolve(copy);
  }

  public async remove<T extends U>(selector: Object): Promise<T[]> {
    return <Promise<T[]>>(this.removePromise = this.removePipe(selector)
      .then(docs => { this.removePromise = undefined; return docs; })
      .catch(err => { this.removePromise = undefined; return err; }));
  }

  public async count(selector?: Object): Promise<number> {
    try {
      return await this._cache.count(selector);
    } catch (err) {
      return this._source.count(selector);
    }
  }

  private await<T>(p: Promise<T> | undefined, fn: Function) {
    if (p) {
      p.then(res => { fn(res); return res; }).catch(err => { fn(); return err; });
    } else {
      fn();
    }
  }
}
