import {component} from '@ziggurat/tiamat';

export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export {Routine} from './controllers/routine';
export {remote} from './database/remote';
export {feed} from './database/filters/feed';
export {sorting} from './database/filters/sort';
export {selector} from './database/filters/selector';
export * from './interfaces';
export * from './controllers/meta/decorators';

import {RoutineAggregator} from './controllers/routine';
import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';

@component({
  providers: [
    LocalDB,
    RemoteDB,
    DatabaseService,
    RoutineAggregator
  ]
})
export class Isimud {}
