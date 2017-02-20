import {component} from '@samizdatjs/tiamat';
import {DatabaseReporter, FileSystemReporter, RequestReporter} from './reporters';

export {FileSystem, file, directory, FileCollection, DirectoryCollection} from './fs';
export {yaml} from './yaml';
export {server, router, get, Server} from './server';
export {ReadOnlyRestProvider} from './rest';
export {CollectionController, DocumentController, DocumentError} from './content';
export * from './content/interfaces';
export * from './content/decorators';

import {FileSystemService, FileCollectionActivator, DirectoryCollectionActivator} from './fs';
import {DatabaseService, MinimongoCache} from './content';
import {ServerActivator} from './server';

@component({
  entities: [
    FileSystemService,
    MinimongoCache,
    ServerActivator,
    DatabaseService,
    DatabaseReporter,
    FileSystemReporter,
    RequestReporter,
    FileCollectionActivator,
    DirectoryCollectionActivator
  ]
})
export class Tashmetu {}
