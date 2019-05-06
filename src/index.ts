import {component} from '@ziggurat/tiamat';

export {inline, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export {Controller} from './database/controller';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';

import {DatabaseConfig} from './database/interfaces';
import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/memory';

@component({
  dependencies: [
    import('@ziggurat/common'),
    import('@ziggurat/ningal')
  ],
  providers: [
    MemoryCollectionFactory,
    DatabaseService,
  ],
  definitions: {
    'isimud.DatabaseConfig': {
      baseUrl: '',
      middleware: []
    } as DatabaseConfig
  }
})
export default class Isimud {}
