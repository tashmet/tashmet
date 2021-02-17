export {fsFile} from './collections/file';
export {fsDirectory} from './collections/directory';
export {fsGlob, GlobConfig} from './collections/glob';
export {vinylFS, VinylFSConfig} from './collections/vinyl';
export {vinylfs} from './fs';
export * from './interfaces';

import {component, Logger, Provider} from '@ziqquratu/ziqquratu';
import {FileSystemConfig} from './interfaces';
import {LocalFileConfigFactory} from './collections/file';
import {VinylFSStreamFactory} from './collections/vinyl';
import {VinylFS, VinylFSServiceFactory} from './fs';
import * as chokidar from 'chokidar';

@component({
  providers: [
    Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
      ignoreInitial: true,
      persistent: true
    })),
    Provider.ofInstance<FileSystemConfig>('vinyl.FileSystemConfig', {
      watch: false,
    }),
    Provider.ofFactory({
      key: 'vinyl.Logger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('vinyl')
    }),
    VinylFS,
  ],
  factories: [
    LocalFileConfigFactory,
    VinylFSStreamFactory,
    VinylFSServiceFactory,
  ]
})
export default class Vinyl {}
