import {component} from '@ziggurat/tiamat';

export {inline, MemoryCollection} from './collections/memory';
export {http} from './collections/http';
export * from './interfaces';
export * from './caching';
export * from './view';

import {DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

@component({
  providers: [
    DatabaseService,
  ],
  instances: {
    'ziggurat.DatabaseConfig': {
      collections: {}
    } as DatabaseConfig
  }
})
export default class Ziggurat {}
