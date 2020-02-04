import {Collection, MemoryCollection, Middleware, MiddlewareFactory} from '@ziqquratu/database';
import {IDCache} from './id';
import {QueryCache} from './query';
import {CachingCursor} from './middleware';

export class CachingMiddlewareFactory extends MiddlewareFactory {
  public create(source: Collection): Middleware {
    const evaluators = [new QueryCache(), new IDCache()];
    const cache = new MemoryCollection(source.name);

    for (const evaluator of evaluators) {
      cache.on('document-upserted', doc => evaluator.add(doc));
      cache.on('document-removed', doc => evaluator.remove(doc));
    }

    return {
      find: (next, selector) => {
        return new CachingCursor(evaluators, cache, next, selector || {});
      },
      upsert: async (next, doc) => {
        return next(await cache.upsert(doc));
      },
      deleteOne: async (next, selector) => {
        await cache.deleteOne(selector);
        return next(selector);
      },
      deleteMany: async (next, selector) => {
        await cache.deleteMany(selector);
        return next(selector);
      },
    }
  }
}

export const caching = () => new CachingMiddlewareFactory();
