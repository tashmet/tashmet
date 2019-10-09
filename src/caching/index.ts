import {Container} from '@ziggurat/tiamat';
import {Collection} from '../interfaces';
import {MemoryCollection} from '../collections/memory';
import {Middleware, MiddlewareProducer} from '../collections/managed';
import {CachingMiddleware, CachingEndpoint} from './middleware';
import {IDCache} from './id';

export {CacheEvaluator, CachingMiddleware} from './middleware';

export function caching(): MiddlewareProducer {
  return (container: Container, source: Collection): Middleware[] => {
    let cache = new MemoryCollection(source.name);

    source.on('document-upserted', doc => cache.upsert(doc));
    source.on('document-removed', doc => cache.remove({_id: doc._id}));

    return [
      new CachingEndpoint(source, cache),
      new CachingMiddleware(source, cache, new IDCache()),
    ];
  };
}
