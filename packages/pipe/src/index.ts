import {Factory} from '@ziqquratu/core';
import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';

export type PipeConnectionMethod = 'insertOne' | 'insertMany' | 'replaceOne' | 'find' | 'findOne';
export type PipeConnectionEvent = 'document-upserted' | 'document-removed';

export interface Pipe {
  process(doc: any): Promise<any>;
}

export abstract class PipeFactory extends Factory<Pipe> {
  public abstract create(source: Collection, database: Database): Pipe;
}

export interface PipeConnectionConfig {
  methods?: PipeConnectionMethod[];
  events?: PipeConnectionEvent[];
  pipe: Pipe | PipeFactory;
}

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private config: PipeConnectionConfig
  ) { super(); }

  public create(source: Collection, database: Database): Middleware {
    const mw: Required<Middleware> = {events: {}, methods: {}};
    const pipe = this.config.pipe instanceof Factory
      ? this.config.pipe.create(source, database)
      : this.config.pipe;

    if (this.hasMethod('findOne')) {
      mw.methods.findOne = async (next, selector) => pipe.process(await next(selector));
    }
    if (this.hasMethod('find')) {
      mw.methods.find = (next, selector, options) => {
        const cursor = next(selector, options);

        return new Proxy(cursor, {
          get: (target, propKey) => {
            switch (propKey) {
              case 'toArray':
                return async () =>
                  Promise.all((await target.toArray()).map(doc => pipe.process(doc)));
              case 'next':
                return async () => {
                  const doc = await target.next();
                  return doc ? pipe.process(doc) : null;
                };
              case 'forEach':
                return async (it: (doc: any) => void) => {
                  const promises: Promise<any>[] = [];
                  await target.forEach(doc => promises.push(pipe.process(doc).then(it)));
                  return Promise.all(promises);
                };
              default:
                return (...args: any[]) => (target as any)[propKey].apply(target, args);
            }
          }
        });
      }
    }
    if (this.hasMethod('insertOne')) {
      mw.methods.insertOne = async (next, doc) => next(await pipe.process(doc));
    }
    if (this.hasMethod('insertMany')) {
      mw.methods.insertMany = async (next, docs) =>
        next(await Promise.all(docs.map(d => pipe.process(d))));
    }
    if (this.hasMethod('replaceOne')) {
      mw.methods.replaceOne = async (next, selector, doc, options) =>
        next(selector, await pipe.process(doc), options);
    }
    if (this.hasEvent('document-upserted')) {
      mw.events['document-upserted'] = async (next, doc) => next(await pipe.process(doc));
    }
    if (this.hasEvent('document-removed')) {
      mw.events['document-removed'] = async (next, doc) => next(await pipe.process(doc));
    }
    return mw;
  }

  private hasMethod(method: PipeConnectionMethod): boolean {
    return this.config.methods !== undefined && this.config.methods.includes(method);
  }

  private hasEvent(event: PipeConnectionEvent): boolean {
    return this.config.events !== undefined && this.config.events.includes(event);
  }
}

export const pipeConnection = (config: PipeConnectionConfig) =>
  new PipeMiddlewareFactory(config);
