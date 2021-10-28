export {vinylfs} from './fs';
export * from './interfaces';

import {vinylfs} from './fs';
import {component, Provider} from '@tashmit/core';
import {FileAccessFactory} from '@tashmit/file';
import * as chokidar from 'chokidar';

@component({
  providers: [
    Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
      ignoreInitial: true,
      persistent: true
    })),
    Provider.ofInstance(FileAccessFactory, vinylfs())
  ],
})
export default class Vinyl {}
