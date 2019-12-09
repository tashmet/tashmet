import {component, Provider} from '@ziggurat/tiamat';

export {memory, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export * from './interfaces';
export * from './caching';
export * from './view';

import {DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

@component({
  providers: [
    DatabaseService,
    Provider.ofInstance<DatabaseConfig>('ziggurat.DatabaseConfig', {
      collections: {}
    })
  ],
})
export default class Ziggurat {}
