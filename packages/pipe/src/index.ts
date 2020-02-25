import {Factory} from '@ziqquratu/core';
import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';

export type PipeHook =
  'insertOne' |
  'insertMany' |
  'replaceOne' |
  'find' |
  'findOne' |
  'document-upserted' |
  'document-removed';

export type Pipe<In = any, Out = In> = (doc: In) => Promise<Out>;

export abstract class PipeFactory extends Factory<Pipe> {
  public abstract create(source: Collection, database: Database): Pipe;
}

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private hooks: PipeHook[],
    private pipe: Pipe | PipeFactory,
  ) { super(); }

  public create(source: Collection, database: Database): Middleware {
    const mw: Required<Middleware> = {events: {}, methods: {}};
    const pipe = this.pipe instanceof Factory
      ? this.pipe.create(source, database)
      : this.pipe;

    if (this.hasHook('findOne')) {
      mw.methods.findOne = async (next, selector) => pipe(await next(selector));
    }
    if (this.hasHook('find')) {
      mw.methods.find = (next, selector, options) => {
        const cursor = next(selector, options);

        return new Proxy(cursor, {
          get: (target, propKey) => {
            switch (propKey) {
              case 'toArray':
                return async () =>
                  Promise.all((await target.toArray()).map(doc => pipe(doc)));
              case 'next':
                return async () => {
                  const doc = await target.next();
                  return doc ? pipe(doc) : null;
                };
              case 'forEach':
                return async (it: (doc: any) => void) => {
                  const promises: Promise<any>[] = [];
                  await target.forEach(doc => promises.push(pipe(doc).then(it)));
                  return Promise.all(promises);
                };
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
      mw.methods.insertMany = async (next, docs) =>
        next(await Promise.all(docs.map(d => pipe(d))));
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

export const eachDocument = (hooks: PipeHook[], pipe: Pipe | PipeFactory) =>
  new PipeMiddlewareFactory(hooks, pipe);
