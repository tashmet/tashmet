import {provider} from '@tashmit/core';
import {
  CachingLayer,
  Collection,
  Database,
  MemoryCollection,
  Middleware,
  QueryAggregator
} from '@tashmit/database';
import {CachingConfig} from './interfaces';
import {CachingCursor} from './cursor';
import {CacheEvaluator} from './evaluator';
import {IDCache} from './id';
import {QueryCache} from './query';

@provider({
  key: CachingLayer,
  inject: [
    Database,
    CachingConfig,
  ]
})
export class CachingLayerService extends CachingLayer {
  public constructor(
    private database: Database,
    private config: CachingConfig
  ) {
    super();
  }

  public create<T>(collection: Collection<T>): Middleware<T> {
    const evaluators: CacheEvaluator[] = [
      new QueryCache(this.config.ttl),
      new IDCache(this.config.ttl)
    ];
    const cache = MemoryCollection.fromConfig(collection.name, this.database, {});

    for (const evaluator of evaluators) {
      cache.on('change', ({action, data}) => {
        for (const doc of data) {
          if (action === 'delete') {
            evaluator.remove(doc);
          } else {
            evaluator.add(doc);
          }
        }
      })
    }

    return {
      events: {
        change: next => async ({action, data, collection}) => {
          switch (action) {
            case 'insert':
              for (const doc of data) {
                await cache.replaceOne({_id: doc._id}, doc, {upsert: true});
              }
              break;
            case 'delete':
              await cache.deleteMany({_id: {$in: data.map(d => d._id)}});
              break;
            case 'replace':
              const [original, replacement] = data;
              await cache.replaceOne({_id: original._id}, replacement, {upsert: true});
              break;
          }
          return next({action, data, collection});
        }
      },
      methods: {
        aggregate: next => async pipeline => {
          const query = QueryAggregator.fromPipeline(pipeline);
          const cursor = new CachingCursor(evaluators, cache, collection.find.bind(collection), query.filter, query.options);
          await cursor.toArray();
          return cache.aggregate(pipeline);
        },
        find: next => (filter, options) => {
          return new CachingCursor(evaluators, cache, next, filter, options);
        },
      }
    } as Middleware;
  }
}
