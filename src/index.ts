import {component} from '@ziggurat/tiamat';

export {inline, MemoryCollection} from './collections/memory';
export {
  managed, Middleware, MiddlewareProducer, ManagedCollectionConfig
} from './collections/managed';
export {http} from './collections/http';
export * from './interfaces';
export * from './view';

import {DatabaseConfig} from './interfaces';
import {DatabaseService} from './database';

@component({
  providers: [
    DatabaseService,
  ],
  definitions: {
    'ziggurat.DatabaseConfig': {
      baseUrl: '',
      collections: {}
    } as DatabaseConfig
  }
})
export default class Ziggurat {}
