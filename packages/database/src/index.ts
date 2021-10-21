import {component, Logger, Provider} from '@tashmit/core';

export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './collections/managed';
export {proxy} from './collections/proxy';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export * from './interfaces';
export * from './middleware';

import {Database} from './interfaces';
import {DatabaseService} from './database';
import {LoggingMiddlewareFactory} from './middleware/logging';

@component({
  providers: [
    DatabaseService,
    Database.configuration({
      collections: {},
      operators: {},
    }),
    Provider.ofFactory<Logger>({
      key: 'tashmit.DatabaseLogger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('database')
    })
  ],
  factories: [
    LoggingMiddlewareFactory
  ]
})
export default class DatabaseComponent {}
