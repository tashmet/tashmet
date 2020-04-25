import {Middleware, Collection, Database, Cursor, DocumentError} from '@ziqquratu/database';
import {Pipe, PipeHook, PipeFactory} from './interfaces';
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

export abstract class PipeFitting {
  public constructor(
    protected pipe: Pipe,
    protected filter: boolean = false
  ) {}

  public abstract attach(middleware: Required<Middleware>, source: Collection): void;
}

export class FindOneFitting extends PipeFitting {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.findOne = async (next, selector) => {
      const doc = await next(selector);
      if (doc) {
        if (!this.filter) {
          return this.pipe(doc);
        }
        try {
          return await this.pipe(doc);
        } catch (err) {
          source.emit('document-error', err);
        }
      }
      return null;
    }
  }
}

export class FindFitting extends PipeFitting {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.find = (next, selector, options) => {
      const cursor = next(selector, options);
      const filter = this.filter;
      const pipe = this.pipe;

      async function toArrayProxy(target: Cursor<any>) {
        const promises = (await target.toArray()).map(doc => pipe(doc));
        return filter
          ? filterResults(promises, err => source.emit('document-error', err))
          : Promise.all(promises);
      }

      async function nextProxy(target: Cursor<any>): Promise<any> {
        const doc = await target.next();
        if (doc) {
          if (!filter) {
            return pipe(doc);
          }
          try {
            return await pipe(doc);
          } catch (err) {
            source.emit('document-error', err);
            return nextProxy(target);
          }
        }
        return null;
      }

      async function forEachProxy(
        target: Cursor<any>, it: (doc: any) => void): Promise<any>
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
              return async () => toArrayProxy(target);
            case 'next':
              return async () => nextProxy(target);
            case 'forEach':
              return async (it: (doc: any) => void) => forEachProxy(target, it);
            default:
              return (...args: any[]) => (target as any)[propKey].apply(target, args);
          }
        }
      });
    }
  }
}

export class InsertOneFitting extends PipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.methods.insertOne = async (next, doc) => next(await this.pipe(doc));
  }
}

export class InsertManyFitting extends PipeFitting  {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.insertMany = async (next, docs) => {
      const promises = docs.map(d => this.pipe(d));
      return this.filter
        ? next(await filterResults(promises, err => source.emit('document-error', err)))
        : next(await Promise.all(promises));
    }
  }
}

export class ReplaceOneFitting extends PipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.methods.replaceOne = async (next, selector, doc, options) =>
      next(selector, await this.pipe(doc), options);
  }
}

export class DocumentUpsertedFitting extends PipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.events['document-upserted'] = async (next, doc) => next(await this.pipe(doc));
  }
}

export class DocumentRemovedFitting extends PipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.events['document-removed'] = async (next, doc) => next(await this.pipe(doc));
  }
}

export class PipeFittingFactory {
  public constructor(
    private pipe: Pipe | PipeFactory,
    private hook: PipeHook,
    private filter: boolean = false
  ) {}

  public async create(source: Collection, database: Database): Promise<PipeFitting> {
    const pipe = this.pipe instanceof PipeFactory
      ? await this.pipe.create(source, database)
      : this.pipe;

    switch (this.hook) {
      case 'insertOne': return new InsertOneFitting(pipe);
      case 'insertMany': return new InsertManyFitting(pipe, this.filter);
      case 'replaceOne': return new ReplaceOneFitting(pipe);
      case 'find': return new FindFitting(pipe, this.filter);
      case 'findOne': return new FindOneFitting(pipe, this.filter);
      case 'document-upserted': return new DocumentUpsertedFitting(pipe);
      case 'document-removed': return new DocumentRemovedFitting(pipe);
    }
  }
}
