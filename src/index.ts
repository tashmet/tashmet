import {component} from '@samizdatjs/tiamat';
export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {EventEmitter} from './util';
export * from './interfaces';
export * from './decorators';

import {DatabaseService} from './database/database';
import {MinimongoCache, MinimongoRemote} from './database/minimongo';

@component({
  entities: [
    MinimongoCache,
    MinimongoRemote,
    DatabaseService,
  ]
})
export class Tashmetu {}
