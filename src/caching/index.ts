import {Container} from '@ziggurat/tiamat';
import {Collection, CollectionProducer} from '../interfaces';
import {MemoryCollection} from '../collections/memory';
import {managed, Middleware, MiddlewareProducer} from '../collections/managed';
import {CachingMiddleware, CachingEndpoint} from './middleware';
import {IDCache} from './id';
import {QueryCache} from './query';

export function caching(): MiddlewareProducer {
  return (container: Container, source: Collection): Middleware[] => {
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

/**
 * Convenience function for creating a cached collection given a source
 *
 * @param source Producer that creates the source collection.
 */
export function cached(source: CollectionProducer): CollectionProducer {
  return managed({
    source: source,
    middleware: [caching()]
  });
}
