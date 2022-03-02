import {Container, Provider} from '@tashmit/core';
export {CachingConfig};

import {provider} from '@tashmit/core';
import MemoryClient, {
  CachingLayer,
  Collection,
  Filter,
  Middleware,
  QueryAggregator,
  mutationSideEffect,
  lockedCursor,
  Database,
} from '@tashmit/database';
import {CachingConfig} from './interfaces';
import {CachingCursor} from './cursor';
import {CacheEvaluator} from './evaluator';
import {IDCache} from './id';
import {QueryCache} from './query';


@provider({
  key: CachingLayer,
  inject: [
    MemoryClient,
    CachingConfig,
  ]
})
export default class CachingLayerPlugin extends CachingLayer {
  private database: Database;

  public constructor(
    client: MemoryClient,
    private config: CachingConfig
  ) {
    super();
    this.database = client.db('__caching__');
  }

  public static configure(config: CachingConfig) {
    return (container: Container) => {
      container.register(Provider.ofInstance(CachingConfig, config));
      container.register(CachingLayerPlugin);
    }
  }

  public create<T>(collection: Collection<T>): Middleware<T> {
    const evaluators: CacheEvaluator[] = [
      new QueryCache(this.config.ttl),
      new IDCache(this.config.ttl)
    ];
    const cache = this.database.collection(collection.collectionName)

    for (const evaluator of evaluators) {
      const cs = cache.watch();
      cs.on('change', ({operationType, documentKey, fullDocument}) => {
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
      insertOne: mutationSideEffect(async (result, doc: any) => {
        await cache.replaceOne({_id: result.insertedId}, doc);
      }),
      insertMany: mutationSideEffect(async (result, docs: any) => {
        await cache.insertMany(docs)
      }),
      deleteOne: mutationSideEffect(async (result, filter: Filter<any>) => {
        await cache.deleteOne(filter)
      }),
      deleteMany: mutationSideEffect(async (result, filter: Filter<any>) => {
        await cache.deleteMany(filter)
      }),
      replaceOne: mutationSideEffect(async (result, filter: Filter<any>, replacement: any) => {
        await cache.replaceOne(filter, replacement, {upsert: true})
      }),
      aggregate: next => pipeline => {
        const query = QueryAggregator.fromPipeline(pipeline);
        const cursor = new CachingCursor(evaluators, cache, collection.find.bind(collection), query.filter, query.options);
        return lockedCursor(cache.aggregate(pipeline), cursor.toArray());
      },
      find: next => (filter, options) => {
        return new CachingCursor(evaluators, cache, next, filter, options);
      },
    } as Middleware;
  }
}
