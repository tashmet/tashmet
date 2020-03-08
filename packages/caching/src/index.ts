import {Collection, MemoryCollection, Middleware, MiddlewareFactory} from '@ziqquratu/database';
import {IDCache} from './id';
import {QueryCache} from './query';
import {CachingCursor} from './middleware';

export interface CachingConfig {
  ttl?: number;
}

export class CachingMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private config: CachingConfig
  ) { super(); }

  public async create(source: Collection): Promise<Middleware> {
    const evaluators = [new QueryCache(this.config.ttl), new IDCache(this.config.ttl)];
    const cache = new MemoryCollection(source.name);

    for (const evaluator of evaluators) {
      cache.on('document-upserted', doc => evaluator.add(doc));
      cache.on('document-removed', doc => evaluator.remove(doc));
    }

    return {
      events: {
        'document-upserted': async (next, doc) => {
          await cache.replaceOne({_id: doc._id}, doc, {upsert: true});
          return next(doc);
        },
        'document-removed': async (next, doc) => {
          await cache.deleteOne({_id: doc._id});
          return next(doc);
        }
      },
      methods: {
        find: (next, selector, options) => {
          return new CachingCursor(evaluators, cache, next, selector, options);
        },
      }
    }
  }
}

export const caching = (config?: CachingConfig) => new CachingMiddlewareFactory(config || {});
