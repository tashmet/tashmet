import {component} from '@ziggurat/tiamat';
import {Ningal} from '@ziggurat/ningal';
import {Common} from '@ziggurat/common';

export {inline, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export {Controller} from './database/controller';
export {json} from './serializers/json';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';

import {DatabaseConfig} from './database/interfaces';
import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/memory';

@component({
  dependencies: [
    Common, Ningal
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
export class Isimud {}
