import {component} from '@samizdatjs/tiamat';
export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {EventEmitter} from './util';
export * from './interfaces';
export * from './decorators';

import {DatabaseService} from './database/database';
import {MemoryDB} from './database/memory';
import {RemoteDB} from './database/remote';

@component({
  entities: [
    MemoryDB,
    RemoteDB,
    DatabaseService,
  ]
})
export class Tashmetu {}
