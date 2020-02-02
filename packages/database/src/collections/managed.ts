import {EventEmitter} from 'eventemitter3';
import {Collection, Cursor, Middleware} from '../interfaces';

export class ManagedCollection<T = any> extends EventEmitter implements Collection<T> {
  public constructor(
    private source: Collection<T>,
    middleware: Middleware[]
  ) {
    super();

    source.on('document-upserted', async doc => {
      this.emit('document-upserted', await this.onDocumentUpserted(doc));
    });
    source.on('document-removed', async doc => {
      this.emit('document-removed', await this.onDocumentRemoved(doc));
    });
    source.on('document-error', async err => {
      this.emit('document-error', await this.onDocumentError(err));
    });

    for (const mw of middleware.reverse()) {
      this.use(mw, ['find', 'findOne', 'upsert', 'delete']);
    }
    for (const mw of middleware) {
      this.use(mw, ['onDocumentUpserted', 'onDocumentRemoved', 'onDocumentError']);
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

  public upsert(obj: any): Promise<any> {
    return this.source.upsert(obj);
  }

  public delete(selector: object): Promise<any[]> {
    return this.source.delete(selector);
  }

  public async onDocumentUpserted(doc: any): Promise<any> {
    return doc;
  }
  
  public async onDocumentRemoved(doc: any): Promise<any> {
    return doc;
  }
  
  public async onDocumentError(err: Error): Promise<Error> {
    return err;
  }

  private use(mw: any, methodNames: string[]) {
    for (const method of methodNames) {
      if (typeof mw[method] === 'function' && (this as any)[method]) {
        const f = (this as any)[method];
        (this as any)[method] = mw[method](f.bind(this));
      }
    }
  }
}
