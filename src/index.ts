import {component} from '@ziggurat/tiamat';
import {Ningal} from '@ziggurat/ningal';

export {Controller} from './database/controller';
export {controllerRoutine} from './database/routine';
export {View} from './view/view';
export {feed} from './view/filters/feed';
export {sorting} from './view/filters/sort';
export {selector} from './view/filters/selector';
export {Document} from './models/document';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export {remote} from './sources/remote';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';
export * from './view/decorators';
export * from './view/interfaces';
export * from './schema/decorators';
export * from './schema/interfaces';

import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/local';
import {RemoteCollectionFactory} from './collections/remote';
import {TransformerService} from './schema/transformer';
import {ValidatorService} from './schema/validator';
import {ViewManager} from './view/viewManager';

@component({
  dependencies: [
    Ningal
  ],
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
