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
      events: {
        'document-upserted': async (next, doc) => {
          await cache.upsert(doc);
          return next(doc);
        },
        'document-removed': async (next, doc) => {
          try {
            await cache.deleteOne({_id: doc._id});
          } catch (err) {}
          return next(doc);
        }
      },
      methods: {
        find: (next, selector) => {
          return new CachingCursor(evaluators, cache, next, selector || {});
        },
      }
    }
  }
}

export const caching = () => new CachingMiddlewareFactory();
