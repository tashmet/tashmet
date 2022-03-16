import {Container, Provider} from '@tashmit/core';
export {CachingConfig};

import {provider} from '@tashmit/core';
import {
  CachingLayer,
  Middleware,
  QueryAggregator,
  mutationSideEffect,
  lockedCursor,
  ChangeSet,
  Store,
} from '@tashmit/database';
import {CachingConfig} from './interfaces';
import {CachingCursor} from './cursor';
import {CacheEvaluator} from './evaluator';
import {IDCache} from './id';
import {QueryCache} from './query';
import MemoryStorageEngine from '@tashmit/memory';


@provider({key: CachingLayer})
export default class CachingLayerPlugin implements CachingLayer {
  public constructor(
    private memory: MemoryStorageEngine,
    private config: CachingConfig
  ) {}

  public static configure(config: CachingConfig) {
    return (container: Container) => {
      container.register(Provider.ofInstance(CachingConfig, config));
      container.register(CachingLayerPlugin);
    }
  }

  public create<T>(store: Store<T>): Middleware<T> {
    const evaluators: CacheEvaluator[] = [
      new QueryCache(this.config.ttl),
      new IDCache(this.config.ttl)
    ];
    const cache = this.memory.createStore({
      ns: {db: `__cache__${store.ns.db}`, coll: store.ns.coll},
      collectionResolver: () => { throw Error('Lookup not supported in cache') }
    });

    for (const evaluator of evaluators) {
      store.on('change', ({operationType, documentKey, fullDocument}) => {
        switch(operationType) {
          case 'delete':
            evaluator.remove(documentKey);
            break;
          case 'insert':
          case 'replace':
          case 'update':
            evaluator.add(fullDocument);
        }
      });
    }

    return {
      write: mutationSideEffect(async (result, cs: ChangeSet<any>) => {
        await cache.write(cs);
      }),
      aggregate: next => pipeline => {
        const query = QueryAggregator.fromPipeline(pipeline);
        const cursor = new CachingCursor(evaluators, cache, store.find.bind(store), query.filter, query.options);
        return lockedCursor(cache.aggregate(pipeline), cursor.toArray());
      },
      find: next => (filter, options) => {
        return new CachingCursor(evaluators, cache, next, filter, options);
      },
    } as Middleware;
  }
}
