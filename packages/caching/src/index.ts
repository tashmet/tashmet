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
      find: (next, selector) => new CachingCursor(evaluators, cache, next, selector || {}),
      upsert: async (next, doc) => {
        return next(await cache.upsert(doc));
      },
      delete: async (next, selector) => {
        await cache.delete(selector);
        return next(selector);
      },
    }
  }
}

export const caching = () => new CachingMiddlewareFactory();
