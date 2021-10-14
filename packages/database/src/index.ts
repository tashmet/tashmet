import {component, Logger, Provider} from '@tashmit/core';

export {AutoEventCollection} from './collections/autoEvent';
export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {proxy} from './collections/proxy';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export {logging} from './logging';
export * from './interfaces';

import {Database} from './interfaces';
import {DatabaseService} from './database';
import {LoggingMiddlewareFactory} from './logging';

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
