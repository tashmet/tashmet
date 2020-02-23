import {Factory} from '@ziqquratu/core';
import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';

export type DocumentPipeMethod = 'insertOne' | 'insertMany' | 'replaceOne';
export type DocumentPipeEvent = 'document-upserted' | 'document-removed';

export interface DocumentPipe {
  process(doc: any): Promise<any>;
}

export abstract class DocumentPipeFactory extends Factory<DocumentPipe> {
  public abstract create(source: Collection, database: Database): DocumentPipe;
}

export interface DocumentPipeMiddlewareConfig {
  methods: DocumentPipeMethod[];
  events: DocumentPipeEvent[];
  pipe: DocumentPipeFactory;
}

export class DocumentPipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private config: DocumentPipeMiddlewareConfig
  ) { super(); }

  public create(source: Collection, database: Database): Middleware {
    const mw: Required<Middleware> = {events: {}, methods: {}};
    const pipe = this.config.pipe.create(source, database);

    if ('insertOne' in this.config.methods) {
      mw.methods.insertOne = (next, doc) => next(pipe.process(doc));
    }
    if ('insertMany' in this.config.methods) {
      mw.methods.insertMany = async (next, docs) =>
        next(await Promise.all(docs.map(d => pipe.process(d))));
    }
    if ('replaceOne' in this.config.methods) {
      mw.methods.replaceOne = (next, selector, doc, options) =>
        next(selector, pipe.process(doc), options);
    }
    if ('document-upserted' in this.config.events) {
      mw.events['document-upserted'] = (next, doc) => next(pipe.process(doc));
    }
    if ('document-removed' in this.config.events) {
      mw.events['document-removed'] = (next, doc) => next(pipe.process(doc));
    }
    return mw;
  }
}

export const documentPipe = (config: DocumentPipeMiddlewareConfig) =>
  new DocumentPipeMiddlewareFactory(config);
