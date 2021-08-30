import {component, Logger, Provider} from '@ziqquratu/core';

export {AutoEventCollection} from './collections/autoEvent';
export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {http} from './collections/http';
export {proxy} from './collections/proxy';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, Query} from './aggregation';
export {logging} from './logging';
export * from './interfaces';

import {Database} from './interfaces';
import {DatabaseService} from './database';
import {LoggingMiddlewareFactory} from './logging';

@component({
  providers: [
    DatabaseService,
    Database.configuration({
      collections: {}
    }),
    Provider.ofFactory<Logger>({
      key: 'ziqquratu.DatabaseLogger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('database')
    })
  ],
  factories: [
    LoggingMiddlewareFactory
  ]
})
export default class DatabaseComponent {}
