import {Factory} from '@ziqquratu/core';
import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';

export type PipeConnectionMethod = 'insertOne' | 'insertMany' | 'replaceOne';
export type PipeConnectionEvent = 'document-upserted' | 'document-removed';

export interface Pipe {
  process(doc: any): Promise<any>;
}

export abstract class PipeFactory extends Factory<Pipe> {
  public abstract create(source: Collection, database: Database): Pipe;
}

export interface PipeConnectionConfig {
  methods: PipeConnectionMethod[];
  events: PipeConnectionEvent[];
  pipe: PipeFactory;
}

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private config: PipeConnectionConfig
  ) { super(); }

  public create(source: Collection, database: Database): Middleware {
    const mw: Required<Middleware> = {events: {}, methods: {}};
    const pipe = this.config.pipe.create(source, database);

    if (this.config.methods.includes('insertOne')) {
      mw.methods.insertOne = async (next, doc) => next(await pipe.process(doc));
    }
    if (this.config.methods.includes('insertMany')) {
      mw.methods.insertMany = async (next, docs) =>
        next(await Promise.all(docs.map(d => pipe.process(d))));
    }
    if (this.config.methods.includes('replaceOne')) {
      mw.methods.replaceOne = async (next, selector, doc, options) =>
        next(selector, await pipe.process(doc), options);
    }
    if (this.config.events.includes('document-upserted')) {
      mw.events['document-upserted'] = async (next, doc) => next(await pipe.process(doc));
    }
    if (this.config.events.includes('document-removed')) {
      mw.events['document-removed'] = async (next, doc) => next(await pipe.process(doc));
    }
    return mw;
  }
}

export const pipeConnection = (config: PipeConnectionConfig) =>
  new PipeMiddlewareFactory(config);
