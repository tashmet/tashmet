import {component, Logger, Provider} from '@ziqquratu/core';

export {memory, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export {applyQueryOptions, sortingMap, AbstractCursor, Selector} from './cursor';
export {logging} from './logging';
export * from './interfaces';

import {DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

@component({
  providers: [
    DatabaseService,
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {}
    }),
    Provider.ofFactory<Logger>({
      key: 'ziqquratu.DatabaseLogger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('database')
    })
  ],
})
export default class DatabaseComponent {}
