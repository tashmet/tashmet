export {vinylfs} from './fs';
export * from './interfaces';

import {component, Logger, Provider} from '@ziqquratu/core';
import {VinylFSServiceFactory} from './fs';
import * as chokidar from 'chokidar';

@component({
  providers: [
    Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
      ignoreInitial: true,
      persistent: true
    })),
    Provider.ofFactory({
      key: 'vinyl.Logger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('vinyl')
    }),
  ],
  factories: [
    VinylFSServiceFactory,
  ]
})
export default class Vinyl {}
