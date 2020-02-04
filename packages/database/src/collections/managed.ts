import {EventEmitter} from 'eventemitter3';
import {Collection, Cursor, DocumentError, Middleware} from '../interfaces';

export class ManagedCollection<T = any> extends EventEmitter implements Collection<T> {
  public constructor(
    private source: Collection<T>,
    middleware: Middleware[]
  ) {
    super();

    const emitters = {
      'document-upserted': 'emitDocumentUpserted',
      'document-removed': 'emitDocumentRemoved',
      'document-error': 'emitDocumentError',
    };

    source.on('document-upserted', doc => {
      this.emitDocumentUpserted(doc);
    });
    source.on('document-removed', doc => {
      this.emitDocumentRemoved(doc);
    });
    source.on('document-error', err => {
      this.emitDocumentError(err);
    });

    for (const mw of middleware.reverse()) {
      this.use(mw.methods || {}, ['find', 'findOne', 'upsert', 'deleteOne', 'deleteMany']);
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

  public get name(): string {
    return this.source.name;
  }

  public find(selector: object = {}): Cursor<any> {
    return this.source.find(selector);
  }

  public async findOne(selector: object): Promise<any> {
    return this.source.findOne(selector);
  }

  public insertOne(obj: any): Promise<any> {
    return this.source.insertOne(obj);
  }

  public deleteOne(selector: object): Promise<any> {
    return this.source.deleteOne(selector);
  }

  public deleteMany(selector: object): Promise<any[]> {
    return this.source.deleteMany(selector);
  }

  private emitDocumentUpserted(doc: any) {
    this.emit('document-upserted', doc);
  }

  private emitDocumentRemoved(doc: any) {
    this.emit('document-removed', doc);
  }

  private emitDocumentError(err: DocumentError) {
    this.emit('document-error', err);
  }

  private proxy(fn: Function, methodName: string) {
    const f = (this as any)[methodName];
    (this as any)[methodName] = (...args: any[]) => fn(f.bind(this), ...args);
  }

  private use(mw: any, methodNames: string[]) {
    for (const method of methodNames) {
      if (typeof mw[method] === 'function' && (this as any)[method]) {
        this.proxy(mw[method], method);
      }
    }
  }
}
