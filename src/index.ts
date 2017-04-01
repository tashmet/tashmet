import {component} from '@samizdatjs/tiamat';

export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {Routine} from './controllers/routine';
export {CollectionBase} from './database/collection';
export {Router} from './router';
export {EventEmitter} from './util';
export {remote} from './database/remote';
export * from './interfaces';
export * from './decorators';
export * from './meta';
export * from './controllers/meta/decorators';

import {RoutineAggregator} from './controllers/routine';
import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';
import {MustacheRenderer} from './renderer';

@component({
  providers: [
    LocalDB,
    RemoteDB,
    DatabaseService,
    RoutineAggregator,
    MustacheRenderer
  ]
})
export class Tashmetu {}
