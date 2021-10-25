export {vinylfs} from './fs';
export * from './interfaces';

import {component, Provider} from '@tashmit/core';
import * as chokidar from 'chokidar';

@component({
  providers: [
    Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
      ignoreInitial: true,
      persistent: true
    })),
  ],
})
export default class Vinyl {}
