import {component} from '@ziggurat/tiamat';
import {Amelatu} from '@ziggurat/amelatu';
import {Ningal} from '@ziggurat/ningal';

export {inline, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export {Controller} from './database/controller';
export {Document} from './models/document';
export {json} from './serializers/json';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';

import {DatabaseConfig} from './database/interfaces';
import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/memory';

@component({
  dependencies: [
    Amelatu,
    Ningal
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
