import {Collection, Database, MemoryCollection, Middleware, MiddlewareFactory, QueryAggregator} from '@ziqquratu/database';
import {CachingCursor} from './cursor';
import {CacheEvaluator} from './evaluator';
import {IDCache} from './id';
import {QueryCache} from './query';

export interface CachingConfig {
  ttl?: number;
}

export class CachingMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private config: CachingConfig
  ) { super(); }

  public async create(source: Collection, database: Database): Promise<Middleware> {
    const evaluators: CacheEvaluator[] = [
      new QueryCache(this.config.ttl),
      new IDCache(this.config.ttl)
    ];
    const cache = new MemoryCollection(source.name, database);

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
          const cursor = new CachingCursor(evaluators, cache, source.find.bind(source), query.filter, query.options);
          await cursor.toArray();
          return cache.aggregate(pipeline);
        },
        find: next => (filter, options) => {
          return new CachingCursor(evaluators, cache, next, filter, options);
        },
      }
    }
  }
}