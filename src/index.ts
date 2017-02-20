import {component} from '@samizdatjs/tiamat';
export {CollectionController} from './controllers/collection';
export {DocumentController} from './controllers/document';
export * from './interfaces';
export * from './decorators';

import {DatabaseService} from './database/database';
import {MinimongoCache} from './database/minimongo';

@component({
  entities: [
    MinimongoCache,
    DatabaseService,
  ]
})
export class Tashmetu {}
