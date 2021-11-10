import {Factory} from '@tashmit/core';
import {Middleware, Collection, Cursor, DocumentError} from '@tashmit/database';
import {allSettled} from './allSettled';
import {
  Pipe,
  PipeHook,
  PipeConfig,
  PipeFactory,
  PipeFitting,
  PipeFittingFactory,
  identityPipe
} from './interfaces';

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


export abstract class OneWayPipeFitting extends PipeFitting {
  public constructor(
    protected pipe: Pipe,
    protected filter: boolean = false
  ) { super(); }
}

export abstract class TwoWayPipeFitting extends PipeFitting {
  public constructor(
    protected pipeIn: Pipe,
    protected pipeOut: Pipe,
    protected filter: boolean = false
  ) {
    super()
  }

  public abstract attach(middleware: Required<Middleware>, source: Collection): void;
}

export class FindOneFitting extends OneWayPipeFitting {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.findOne = next => async selector => {
      const doc = await next(selector);
      if (doc) {
        if (!this.filter) {
          return this.pipe(doc);
        }
        try {
          return await this.pipe(doc);
        } catch (err) {
          source.emit('error', err);
        }
      }
      return null;
    }
  }
}

export class FindFitting extends OneWayPipeFitting {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.find = next => (selector, options) => {
      const cursor = next(selector, options);
      const filter = this.filter;
      const pipe = this.pipe;

      async function toArrayProxy(target: Cursor<any>) {
        const promises = (await target.toArray()).map(doc => pipe(doc));
        return filter
          ? filterResults(promises, err => source.emit('error', err))
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
            source.emit('error', err);
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
          ? filterResults(promises, err => source.emit('error', err))
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

export class InsertOneFitting extends TwoWayPipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.methods.insertOne = next => async doc =>
      this.pipeOut(await next(await this.pipeIn(doc)));
  }
}

export class InsertManyFitting extends TwoWayPipeFitting  {
  public async attach(middleware: Required<Middleware>, source: Collection) {
    middleware.methods.insertMany = next => async docs => {
      const promises = docs.map(d => this.pipeIn(d));
      const outDocs = this.filter
        ? await next(await filterResults(promises, err => source.emit('error', err)))
        : await next(await Promise.all(promises));
      return Promise.all(outDocs.map(d => this.pipeOut(d)));
    }
  }
}

export class ReplaceOneFitting extends TwoWayPipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.methods.replaceOne = next => async (selector, doc, options) =>
      this.pipeOut(await next(selector, await this.pipeIn(doc), options));
  }
}
/*
export class DocumentUpsertedFitting extends OneWayPipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.events['change'] = async (next, change) => next(await this.pipe(doc));
  }
}

export class DocumentRemovedFitting extends OneWayPipeFitting  {
  public async attach(middleware: Required<Middleware>) {
    middleware.events['document-removed'] = async (next, doc) => next(await this.pipe(doc));
  }
}
*/

export function pipeFitting(pipes: PipeConfig[]): PipeFittingFactory {
  return Factory.of(({collection, database, container}) => {
    const createPipe = (pipe: Pipe | PipeFactory) => {
      return pipe instanceof Factory ? pipe.resolve(container)({collection, database}) : pipe;
    }

    const filter = (hook: PipeHook) => {
      const cfg = pipes.find(p => p.hook === hook);
      return cfg ? cfg.filter : false;
    }

    const hooks: PipeHook[] = [
      'insertOneIn', 'insertOneOut', 'insertManyIn', 'insertManyOut', 'replaceOneIn', 'replaceOneOut',
      'find', 'findOne', 'document-upserted', 'document-removed'
    ];

    const pipeDict: Record<PipeHook, Pipe> = {} as any;
    for (const hook of hooks) {
      const cfg = pipes.find(p => p.hook === hook);
      pipeDict[hook] = cfg ? createPipe(cfg.pipe) : identityPipe;
    }

    const fittings: PipeFitting[] = [
      new InsertOneFitting(pipeDict.insertOneIn, pipeDict.insertOneOut),
      new InsertManyFitting(pipeDict.insertManyIn, pipeDict.insertManyOut, filter('insertManyIn')),
      new ReplaceOneFitting(pipeDict.replaceOneIn, pipeDict.replaceOneOut),
      new FindFitting(pipeDict.find, filter('find')),
      new FindOneFitting(pipeDict.findOne, filter('findOne')),
      // new DocumentUpsertedFitting(pipeDict["document-upserted"]),
      // new DocumentRemovedFitting(pipeDict["document-removed"]),
    ];

    return fittings;
  });
}
