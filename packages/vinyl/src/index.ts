export {vinylfs} from './fs';
export * from './interfaces';

import {Container, Plugin, Provider} from '@tashmit/core';
import {FileAccessFactory} from '@tashmit/file';
import * as chokidar from 'chokidar';
import {vinylfs} from './fs';
import {FileSystemConfig} from './interfaces';

export default class Vinyl extends Plugin {
  public constructor(private config: FileSystemConfig) {
    super();
  }

  public register(container: Container) {
    if (this.config.watch) {
      container.register(
        Provider.ofInstance<chokidar.FSWatcher>('chokidar.FSWatcher', chokidar.watch([], {
          ignoreInitial: true,
          persistent: true
        }))
      );
    }
    container.register(Provider.ofInstance(FileAccessFactory, vinylfs()));
  }
}
