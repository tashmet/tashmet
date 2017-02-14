import {component} from '@samizdatjs/tiamat';
import {DatabaseReporter, FileSystemReporter, RequestReporter} from './reporters';

export {FileSystem, DirectoryProvider, FileProvider} from './fs';
export {yaml} from './yaml';
export {server, router, get, Server} from './server';
export {ReadOnlyRestProvider} from './rest';
export {CollectionController, DocumentController, DocumentError} from './content';
export * from './content/interfaces';
export * from './content/decorators';

import {FileSystemService} from './fs';
import {DatabaseService, StreamActivator, MinimongoCache} from './content';
import {ServerActivator} from './server';

@component({
  entities: [
    FileSystemService,
    MinimongoCache,
    ServerActivator,
    DatabaseService,
    StreamActivator,
    DatabaseReporter,
    FileSystemReporter,
    RequestReporter
  ]
})
export class Tashmetu {}
