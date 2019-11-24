import {MiddlewareProducer} from '../interfaces';
import {MemoryCollection} from '../collections/memory';
import {CachingMiddleware, CachingEndpoint} from './middleware';
import {IDCache} from './id';
import {QueryCache} from './query';

export function caching(): MiddlewareProducer {
  return source => {
    let cache = new MemoryCollection(source.name);

    source.on('document-upserted', doc => cache.upsert(doc));
    source.on('document-removed', doc => cache.remove({_id: doc._id}));

    return [
      new CachingEndpoint(source, cache),
      new CachingMiddleware(source, cache, new QueryCache()),
      new CachingMiddleware(source, cache, new IDCache()),
    ];
  };
}
