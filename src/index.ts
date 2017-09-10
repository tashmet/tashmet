import {component} from '@ziggurat/tiamat';

export {CollectionController} from './controllers/collection';
export {Routine} from './controllers/routine';
export {ViewBase} from './database/view';
export {remote} from './database/remote';
export {feed} from './database/filters/feed';
export {sorting} from './database/filters/sort';
export {selector} from './database/filters/selector';
export {Document} from './models/document';
export * from './interfaces';
export * from './controllers/meta/decorators';
export * from './database/decorators';
export * from './schema/decorators';
export * from './schema/interfaces';

import {RoutineAggregator} from './controllers/routine';
import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';
import {TransformerService} from './schema/transformer';
import {ValidatorService} from './schema/validator';

@component({
  providers: [
    LocalDB,
    RemoteDB,
    DatabaseService,
    RoutineAggregator,
    TransformerService,
    ValidatorService
  ]
})
export class Isimud {}
