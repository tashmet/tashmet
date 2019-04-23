import {Newable} from '@ziggurat/meta';
import {Processor, Sequence} from '@ziggurat/ningal';
import {Validator} from '@ziggurat/common';
import {Collection, QueryOptions, Query} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import clone from 'lodash/clone';
import find from 'lodash/find';
import pull from 'lodash/pull';
import {RevisionUpsertPipe} from '../pipes/upsert';
import {ValidationPipe} from '../pipes/validation';
import {FindPipe, FindOnePipe} from '../pipes/find';
import {PopulatePipe} from '../pipes/populate';
import {RemovePipe} from '../pipes/remove';

export class Controller<U = any>
  extends EventEmitter implements Collection<U>
{
  public locked = false;
  private upsertQueue: string[] = [];
  private populatePromise: Promise<U[]>;
  private removePromise: Promise<U[]> | undefined;
  private findPipe: (q: Query) => Promise<U[]>;
  private findOnePipe: (selector: object) => Promise<U>;
  private removePipe: (selector: object) => Promise<U[]>;
  private populatePipe: (selector: object) => Promise<U[]>;
  private upsertPipe: (doc: U) => Promise<U>;

  constructor(
    public readonly name: string,
    public readonly model: Newable<U> | undefined,
    public readonly source: Collection,
    public readonly cache: Collection,
    public readonly buffer: Collection,
    processor: Processor,
    validator?: Validator
  ) {
    super();

    let cachePipe = new RevisionUpsertPipe<U>(cache);
    let validationPipe = new ValidationPipe<U>(validator);

    this.findPipe = processor.pipe<Query, U[]>('find', new FindPipe(
      source, cache, cachePipe, validationPipe
    ));
    this.findOnePipe = processor.pipe<object, U>('find-one', new FindOnePipe<U>(
      source, cache, cachePipe, validationPipe
    ));
    this.removePipe = processor.pipe<object, U[]>('remove', new RemovePipe(
      source, cache
    ));
    this.populatePipe = processor.pipe<object, U[]>('populate', new PopulatePipe(
      this.name, source, buffer, cachePipe, validationPipe
    ));
    this.upsertPipe = processor.pipe<U>('upsert', new Sequence({
      'validate': validationPipe,
      'cache': cachePipe,
      'persist': (doc: U) => source.upsert(doc)
    }));

    const sourceUpsertPipe = processor.pipe<U>('source-upsert', new Sequence({
      'validate': validationPipe,
      'cache': cachePipe
    }));
    const sourceRemovePipe = processor.pipe<object, U[]>('source-remove', new Sequence({
      'uncache': async (selector: object) => this.cache.remove(selector)
    }));

    cache.on('document-upserted', (doc: U) => {
      this.emit('document-upserted', doc);
    });
    cache.on('document-removed', (doc: U) => {
      this.emit('document-removed', doc);
    });

    source.on('document-upserted', (doc: any) => {
      if (!this.locked) {
        doc._collection = this.name;
        if (this.upsertQueue.indexOf(doc._id) < 0) {
          sourceUpsertPipe(doc);
        }
      }
    });
    source.on('document-removed', (doc: any) => {
      this.await(this.removePromise, (res: any[] | undefined) => {
        if (!res || !find(res, {_id: doc._id})) {
          sourceRemovePipe({_id: doc._id});
        }
      });
    });
  }

  public populate(): Promise<U[]> {
    if (!this.populatePromise && this.source) {
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

  public async upsert<T extends U>(doc: any): Promise<T> {
    let copy = <any>clone(doc);
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
    return this.source.count(selector);
  }

  private await<T>(p: Promise<T> | undefined, fn: Function) {
    if (p) {
      p.then(res => { fn(res); return res; }).catch(err => { fn(); return err; });
    } else {
      fn();
    }
  }
}
