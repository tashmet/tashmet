import {component} from '@samizdatjs/tiamat';
export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {CollectionBase} from './database/collection';
export {EventEmitter} from './util';
export * from './interfaces';
export * from './decorators';

import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';

@component({
  entities: [
    LocalDB,
    RemoteDB,
    DatabaseService,
  ]
})
export class Tashmetu {}
