import {component} from '@ziggurat/tiamat';

export {Controller} from './controllers/controller';
export {controllerRoutine} from './controllers/routine';
export {View} from './view/view';
export {feed} from './view/filters/feed';
export {sorting} from './view/filters/sort';
export {selector} from './view/filters/selector';
export {Document} from './models/document';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export {remote} from './sources/remote';
export * from './interfaces';
export * from './controllers/decorators';
export * from './controllers/interfaces';
export * from './processing/decorators';
export * from './processing/interfaces';
export * from './view/decorators';
export * from './view/interfaces';
export * from './schema/decorators';
export * from './schema/interfaces';

import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './database/local';
import {RemoteCollectionFactory} from './database/remote';
import {TransformerService} from './schema/transformer';
import {ValidatorService} from './schema/validator';
import {ViewManager} from './view/viewManager';

@component({
  providers: [
    MemoryCollectionFactory,
    RemoteCollectionFactory,
    DatabaseService,
    TransformerService,
    ValidatorService,
    ViewManager
  ],
  autoCreate: ['isimud.ViewManager']
})
export class Isimud {}
