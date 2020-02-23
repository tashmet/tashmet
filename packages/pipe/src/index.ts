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

export const documentPipe = (config: DocumentPipeMiddlewareConfig) =>
  new DocumentPipeMiddlewareFactory(config);
