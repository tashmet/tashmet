import {component} from '@tashmit/core';
import {Database} from './interfaces';
import {DatabaseService} from './database';

export {memory, MemoryCollection, MemoryCollectionConfig} from './collections/memory';
export {withMiddleware} from './collections/managed';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {aggregate, QueryAggregator} from './aggregation';
export * from './interfaces';
export * from './middleware';

@component({
  providers: [
    DatabaseService,
    Database.configuration({
      collections: {},
      operators: {},
    }),
  ],
})
export default class DatabaseComponent {}
