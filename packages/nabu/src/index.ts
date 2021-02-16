export {json} from './pipes/json';
export {yaml, YamlConfig} from './pipes/yaml';
export {bundledBuffer, shardedBuffer} from './collections/buffer';
export {bundle, fsFile, FileStreamConfig, BundleConfig} from './collections/file';
export {directory} from './collections/directory';
export {glob, GlobConfig} from './collections/glob';
// export {ipfs, ipfsDirectory, IPFSConfig} from './collections/ipfs';
export {vinylFS, VinylFSConfig} from './collections/vinyl';
export * from './interfaces';

import {component, Logger, Provider} from '@ziqquratu/ziqquratu';
import {FileSystemConfig} from './interfaces';
import {BundledBufferCollectionFactory, ShardedBufferCollectionFactory} from './collections/buffer';
import {BundleFactory, LocalFileConfigFactory} from './collections/file';
// import {IPFSFactory} from './collections/ipfs';
import {VinylFSFactory} from './collections/vinyl';
import {VinylFS} from './vinyl/fs';
import * as chokidar from 'chokidar';
// import ipfsClient from 'ipfs-http-client';

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
    VinylFS,
    /*
    Provider.ofFactory({
      key: 'ipfs',
      create: () => ipfsClient(),
    }),
    */
  ],
  factories: [
    BundledBufferCollectionFactory,
    ShardedBufferCollectionFactory,
    BundleFactory,
    LocalFileConfigFactory,
    VinylFSFactory,
    // IPFSFactory,
  ]
})
export default class Nabu {}
