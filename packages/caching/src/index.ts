import {Container, Provider} from '@tashmet/tashmet';
export {CachingConfig};

import {provider} from '@tashmet/tashmet';
import {
  Aggregator,
  CachingLayer,
  MemoryStorageEngine,
  Middleware,
  mutationSideEffect,
  ChangeSet,
  Store,
  HashCode,
} from '@tashmet/tashmet';
import {CachingConfig} from './interfaces';
import {CacheEvaluator, isCached} from './evaluator';
import {IDCache} from './id';
import {QueryCache} from './query';


@provider({
  key: CachingLayer,
  inject: [MemoryStorageEngine, CachingConfig, HashCode, Aggregator]
})
export default class CachingLayerPlugin implements CachingLayer {
  public constructor(
    private memory: MemoryStorageEngine,
    private config: CachingConfig,
    private hashCode: HashCode,
  ) {}

  public static configure(config: CachingConfig) {
    return (container: Container) => {
      container.register(Provider.ofInstance(CachingConfig, config));
      container.register(CachingLayerPlugin);
    }
  }

  public create<T>(store: Store<T>): Middleware<T> {
    const evaluators: CacheEvaluator[] = [
      new QueryCache(this.config.ttl, this.hashCode),
      new IDCache(this.config.ttl)
    ];
    const cache = this.memory.createStore({
      ns: {db: `__cache__${store.ns.db}`, coll: store.ns.coll},
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
      count: next => (filter, options) => {
        return evaluators.some(e => e.isCached(filter || {}, options || {}))
          ? cache.count(filter)
          : next(filter);
      },
      find: next => async (filter, options) => {
        filter = filter || {};
        options = options || {};

        const orgFilter = JSON.parse(JSON.stringify(filter));
        const orgOptions = JSON.parse(JSON.stringify(options));

        if (!isCached(evaluators, filter, options)) {
          const incoming = await next(filter);
          const outgoing = await cache.find(filter);
          await cache.write(new ChangeSet(incoming.cursor.firstBatch, outgoing.cursor.firstBatch));

          for (const evaluator of evaluators) {
            evaluator.success(filter, options);
          }
        }
        return cache.find(orgFilter, orgOptions);
      },
    } as Middleware;
  }
}
