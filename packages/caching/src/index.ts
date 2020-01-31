import {Collection, Middleware, MemoryCollection, MiddlewareFactory} from '@ziqquratu/database';
import {CachingMiddleware} from './middleware';
import {IDCache} from './id';
import {QueryCache} from './query';

export class CachingMiddlewareFactory extends MiddlewareFactory {
  public create(source: Collection): Middleware[] {
    const cache = new MemoryCollection(source.name);

    source.on('document-upserted', doc => cache.upsert(doc));
    source.on('document-removed', doc => cache.delete({_id: doc._id}));

    return [
      new CachingMiddleware(source, cache, [new QueryCache(), new IDCache()]),
    ];
  }
}

export const caching = () => new CachingMiddlewareFactory();
