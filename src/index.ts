import {component} from '@ziggurat/tiamat';

export {CollectionController} from './controllers/collection';
export {Routine} from './controllers/routine';
export {View} from './view/view';
export {remote} from './database/remote';
export {feed} from './view/filters/feed';
export {sorting} from './view/filters/sort';
export {selector} from './view/filters/selector';
export {Document} from './models/document';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export * from './interfaces';
export * from './controllers/decorators';
export * from './controllers/interfaces';
export * from './view/decorators';
export * from './view/interfaces';
export * from './schema/decorators';
export * from './schema/interfaces';

import {RoutineAggregator} from './controllers/routine';
import {DatabaseService} from './database/database';
import {LocalDB} from './database/local';
import {RemoteDB} from './database/remote';
import {TransformerService} from './schema/transformer';
import {ValidatorService} from './schema/validator';
import {ViewManager} from './view/viewManager';

@component({
  providers: [
    LocalDB,
    RemoteDB,
    DatabaseService,
    RoutineAggregator,
    TransformerService,
    ValidatorService,
    ViewManager
  ],
  autoCreate: ['isimud.ViewManager']
})
export class Isimud {}
