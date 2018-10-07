import {component} from '@ziggurat/tiamat';
import {Amelatu} from '@ziggurat/amelatu';
import {Ningal} from '@ziggurat/ningal';

export {MemoryCollection} from './collections/memory';
export {Controller} from './database/controller';
export {Document} from './models/document';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export {remote} from './sources/remote';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';

import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/memory';
import {RemoteCollectionFactory} from './collections/remote';

@component({
  dependencies: [
    Amelatu,
    Ningal
  ],
  providers: [
    RemoteCollectionFactory,
    MemoryCollectionFactory,
    DatabaseService,
  ],
  autoCreate: []
})
export class Isimud {}
