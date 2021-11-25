import {provider} from '@tashmit/core';
import {
  CachingLayer,
  Collection,
  Database,
  Filter,
  Middleware,
  QueryAggregator,
  mutationSideEffect,
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
    const cache = this.database.collection(`${collection.name}.__cache__`)

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
      aggregate: next => async pipeline => {
        const query = QueryAggregator.fromPipeline(pipeline);
        const cursor = new CachingCursor(evaluators, cache, collection.find.bind(collection), query.filter, query.options);
        await cursor.toArray();
        return cache.aggregate(pipeline);
      },
      find: next => (filter, options) => {
        return new CachingCursor(evaluators, cache, next, filter, options);
      },
    } as Middleware;
  }
}
