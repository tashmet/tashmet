export {json} from './pipes/json';
export {yaml, YamlConfig} from './pipes/yaml';
export {buffer} from './collections/buffer';
export {file, FileConfig} from './collections/file';
export {directory, DirectoryConfig} from './collections/directory';
export {glob, GlobConfig} from './collections/glob';
export {ipfs, IPFSConfig} from './collections/ipfs';
export {vinylFS, VinylFSConfig} from './collections/vinyl';
export * from './interfaces';

import {component, Logger, Provider} from '@ziqquratu/ziqquratu';
import {FileSystemConfig} from './interfaces';
import {BufferCollectionFactory} from './collections/buffer';
import {FileFactory} from './collections/file';
import {IPFSFactory} from './collections/ipfs';
import {VinylFSFactory} from './collections/vinyl';
import * as chokidar from 'chokidar';
import ipfsClient from 'ipfs-http-client';

@component({
  providers: [
    Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
      ignoreInitial: true,
      persistent: true
    })),
    Provider.ofInstance<FileSystemConfig>('nabu.FileSystemConfig', {
      watch: false,
    }),
    Provider.ofFactory({
      key: 'nabu.Logger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('nabu')
    }),
    Provider.ofFactory({
      key: 'ipfs',
      create: () => ipfsClient(),
    }),
  ],
  factories: [
    BufferCollectionFactory,
    FileFactory,
    VinylFSFactory,
    IPFSFactory,
  ]
})
export default class Nabu {}
