import {EventEmitter} from 'eventemitter3';
import {Collection, Cursor, DocumentError, Middleware, ReplaceOneOptions, QueryOptions} from '../interfaces';

export class ManagedCollection<T = any> extends EventEmitter implements Collection<T> {
  public constructor(
    public readonly name: string,
    private source: Collection<T>,
    middleware: Middleware[]
  ) {
    super();

    const emitters = {
      'document-upserted': 'processDocumentUpserted',
      'document-removed': 'processDocumentRemoved',
      'document-error': 'emitDocumentError',
    };

    source.on('document-upserted', doc => {
      this.processDocumentUpserted(doc)
        .then(doc => this.emit('document-upserted', doc))
        .catch(err => this.emitDocumentError(err));
    });
    source.on('document-removed', doc => {
      this.processDocumentRemoved(doc)
        .then(doc => this.emit('document-removed', doc))
        .catch(err => this.emitDocumentError(err));
    });
    source.on('document-error', err => {
      this.emitDocumentError(err);
    });

    for (const mw of middleware.slice(0).reverse()) {
      this.use(mw.methods || {});
    }
    for (const mw of middleware) {
      if (mw.events) {
        for (const event of Object.keys(emitters)) {
          if ((mw.events as any)[event]) {
            this.proxy((mw.events as any)[event], (emitters as any)[event]);
          }
        }
      }
    }
  }

  public toString(): string {
    return this.source.toString();
  }
  
  public async aggregate(pipeline: Record<string, any>[]): Promise<any> {
    return this.source.aggregate(pipeline);
  }

  public find(selector: object = {}, options: QueryOptions = {}): Cursor<T> {
    return this.source.find(selector, options);
  }

  public async findOne(selector: object): Promise<T | null> {
    return this.source.findOne(selector);
  }

  public insertOne(doc: T): Promise<T> {
    return this.source.insertOne(doc);
  }

  public insertMany(docs: T[]): Promise<T[]> {
    return this.source.insertMany(docs);
  }

  public async replaceOne(selector: object, doc: T, options?: ReplaceOneOptions): Promise<T | null> {
    return this.source.replaceOne(selector, doc, options);
  }

  public deleteOne(selector: object): Promise<T | null> {
    return this.source.deleteOne(selector);
  }

  public deleteMany(selector: object): Promise<T[]> {
    return this.source.deleteMany(selector);
  }

  private async processDocumentUpserted(doc: T): Promise<T> {
    return doc;
  }

  private async processDocumentRemoved(doc: T): Promise<T> {
    return doc;
  }

  private emitDocumentError(err: DocumentError) {
    this.emit('document-error', err);
  }

  private proxy(fn: Function, methodName: string) {
    const f = (this as any)[methodName];
    (this as any)[methodName] = (...args: any[]) => fn(f.bind(this), ...args);
  }

  private use(mw: any) {
    for (const method of Object.keys(mw)) {
      if (typeof mw[method] === 'function' && (this as any)[method]) {
        this.proxy(mw[method], method);
      }
    }
  }
}
