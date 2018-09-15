import {component} from '@ziggurat/tiamat';
import {Mushdamma} from '@ziggurat/mushdamma';
import {Ningal} from '@ziggurat/ningal';

export {MemoryCollection} from './collections/memory';
export {Controller} from './database/controller';
export {View} from './view/view';
export {FeedFilter, FeedConfig} from './view/filters/feed';
export {RangeFilter, RangeConfig} from './view/filters/range';
export {SortingFilter, SortingConfig} from './view/filters/sort';
export {SelectorFilter, SelectorConfig} from './view/filters/selector';
export {Document} from './models/document';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export {remote} from './sources/remote';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';
export * from './view/decorators';
export * from './view/interfaces';

import {DatabaseService} from './database/database';
import {MemoryCollectionFactory} from './collections/memory';
import {RemoteCollectionFactory} from './collections/remote';

@component({
  dependencies: [
    Mushdamma,
    Ningal
  ],
  providers: [
    RemoteCollectionFactory,
    MemoryCollectionFactory,
    DatabaseService,
  ],
  autoCreate: []
})
export class Isimud {}
