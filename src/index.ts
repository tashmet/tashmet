import {component} from '@ziggurat/tiamat';

export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {Routine} from './controllers/routine';
export {Router} from './router';
export {remote} from './database/remote';
export {selectorFilter, feedFilter, sortFilter, valueSelectorFilter} from './database/filters';
export * from './interfaces';
export * from './decorators';
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
export class Isimud {}
