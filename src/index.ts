import {component} from '@ziggurat/tiamat';
import {Mushdamma} from '@ziggurat/mushdamma';
import {Ningal} from '@ziggurat/ningal';

export {MemoryCollection} from './collections/memory';
export {Controller} from './database/controller';
export {View} from './view/view';
export {FeedFilter} from './view/filters/feed';
export {RangeFilter} from './view/filters/range';
export {SortingFilter} from './view/filters/sort';
export {SelectorFilter} from './view/filters/selector';
export {Document} from './models/document';
export {relationships, ComparatorList} from './middleware/relationships';
export {json} from './serializers/json';
export {inline} from './sources/inline';
export {remote} from './sources/remote';
export * from './interfaces';
export * from './database/decorators';
export * from './database/interfaces';
export * from './view/decorators';
export * from './view/interfaces';

import {DatabaseService} from './database/database';
import {RemoteCollectionFactory} from './collections/remote';

@component({
  dependencies: [
    Mushdamma,
    Ningal
  ],
  providers: [
    RemoteCollectionFactory,
    DatabaseService,
  ],
  autoCreate: []
})
export class Isimud {}
