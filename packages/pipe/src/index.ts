import {AsyncFactory} from '@ziqquratu/core';
import {Middleware, MiddlewareFactory, Collection, Database, Cursor, DocumentError} from '@ziqquratu/database';
import {allSettled} from './allSettled';

async function filterResults<T>(
  promises: Iterable<Promise<T>>, error: (err: DocumentError) => void): Promise<T[]>
{
  const results = await allSettled(promises);
  const fulfilled: T[] = [];
  for (const r of results) {
    if (r.status === 'rejected') {
      error(r.reason as DocumentError);
    } else {
      fulfilled.push(r.value);
    }
  }
  return fulfilled;
}

export type PipeHook =
  'insertOne' |
  'insertMany' |
  'replaceOne' |
  'find' |
  'findOne' |
  'document-upserted' |
  'document-removed';

export type Pipe<In = any, Out = In> = (doc: In) => Promise<Out>;

export abstract class PipeFactory extends AsyncFactory<Pipe> {
  public abstract create(source: Collection, database: Database): Promise<Pipe>;
}

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private hooks: PipeHook[],
    private pipe: Pipe | PipeFactory,
    private filter: boolean,
  ) { super(); }

  public async create(source: Collection, database: Database): Promise<Middleware> {
    const mw: Required<Middleware> = {events: {}, methods: {}};
    const pipe = this.pipe instanceof PipeFactory
      ? await this.pipe.create(source, database)
      : this.pipe;

    if (this.hasHook('findOne')) {
      mw.methods.findOne = async (next, selector) => {
        const doc = await next(selector);
        if (doc) {
          if (!this.filter) {
            return pipe(doc);
          }
          try {
            return await pipe(doc);
          } catch (err) {
            source.emit('document-error', err);
          }
        }
        return null;
      }
    }
    if (this.hasHook('find')) {
      mw.methods.find = (next, selector, options) => {
        const cursor = next(selector, options);

        async function toArrayProxy(target: Cursor<any>, filter: boolean) {
          const promises = (await target.toArray()).map(doc => pipe(doc));
          return filter
            ? filterResults(promises, err => source.emit('document-error', err))
            : Promise.all(promises);
        }

        async function nextProxy(target: Cursor<any>, filter: boolean): Promise<any> {
          const doc = await target.next();
          if (doc) {
            if (!filter) {
              return pipe(doc);
            }
            try {
              return await pipe(doc);
            } catch (err) {
              source.emit('document-error', err);
              return nextProxy(target, filter);
            }
          }
          return null;
        }

        async function forEachProxy(
          target: Cursor<any>, filter: boolean, it: (doc: any) => void): Promise<any>
        {
          const promises: Promise<any>[] = [];
          await target.forEach(doc => promises.push(pipe(doc).then(it)));
          return filter
            ? filterResults(promises, err => source.emit('document-error', err))
            : Promise.all(promises);
        }

        return new Proxy(cursor, {
          get: (target, propKey) => {
            switch (propKey) {
              case 'toArray':
                return async () => toArrayProxy(target, this.filter);
              case 'next':
                return async () => nextProxy(target, this.filter);
              case 'forEach':
                return async (it: (doc: any) => void) => forEachProxy(target, this.filter, it);
              default:
                return (...args: any[]) => (target as any)[propKey].apply(target, args);
            }
          }
        });
      }
    }
    if (this.hasHook('insertOne')) {
      mw.methods.insertOne = async (next, doc) => next(await pipe(doc));
    }
    if (this.hasHook('insertMany')) {
      mw.methods.insertMany = async (next, docs) => {
        const promises = docs.map(d => pipe(d));
        return this.filter
          ? next(await filterResults(promises, err => source.emit('document-error', err)))
          : next(await Promise.all(promises));
      }
    }
    if (this.hasHook('replaceOne')) {
      mw.methods.replaceOne = async (next, selector, doc, options) =>
        next(selector, await pipe(doc), options);
    }
    if (this.hasHook('document-upserted')) {
      mw.events['document-upserted'] = async (next, doc) => next(await pipe(doc));
    }
    if (this.hasHook('document-removed')) {
      mw.events['document-removed'] = async (next, doc) => next(await pipe(doc));
    }
    return mw;
  }

  private hasHook(hook: PipeHook): boolean {
    return this.hooks.includes(hook);
  }
}

export interface EachDocumentConfig {
  /** The methods and events to apply the pipe to */
  hooks: PipeHook[];

  /** A pipe or a factory producing a pipe */
  pipe: Pipe | PipeFactory;

  /**
   * Filter successful documents
   * 
   * When set to true the pipe will act as a filter, only forwarding documents
   * that were successfully processed. If the pipe resolves with an error the
   * document is skipped and a document-error event is emitted from the collection.
   */
  filter?: boolean;
}

export const eachDocument = (config: EachDocumentConfig) =>
  new PipeMiddlewareFactory(config.hooks, config.pipe, config.filter === true);
