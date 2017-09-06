import {component} from '@ziggurat/tiamat';

export {CollectionController} from './controllers/collection';
export {Routine} from './controllers/routine';
export {ViewBase} from './database/view';
export {remote} from './database/remote';
export {feed} from './database/filters/feed';
export {sorting} from './database/filters/sort';
export {selector} from './database/filters/selector';
export * from './interfaces';
export * from './controllers/meta/decorators';
export * from './database/decorators';
export * from './transformation/decorators';
export * from './transformation/interfaces';

import {RoutineAggregator} from './controllers/routine';
import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';
import {TransformerService} from './transformation/transformer';

@component({
  providers: [
    LocalDB,
    RemoteDB,
    DatabaseService,
    RoutineAggregator,
    TransformerService
  ]
})
export class Isimud {}
