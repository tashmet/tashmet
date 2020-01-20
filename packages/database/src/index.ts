import {component, Provider} from '@ziqquratu/ioc';

export {memory, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export * from './interfaces';

import {DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

@component({
  providers: [
    DatabaseService,
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {}
    })
  ],
})
export default class DatabaseComponent {}
