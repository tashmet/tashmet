export {markdown} from './converters/markdown';
export {json} from './pipes/json';
export {yaml, YamlConfig} from './pipes/yaml';
export {file} from './collections/file';
export {directory} from './sources/directory';
export * from './interfaces';

import {component, Logger, Provider} from '@ziqquratu/ziqquratu';
import {FileSystemConfig} from './interfaces';
import {FileBufferFactory} from './collections/file';
import {DirectoryCollectionFactory} from './sources/directory';
import * as chokidar from 'chokidar';

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
    })
  ],
  factories: [
    FileBufferFactory,
    DirectoryCollectionFactory,
  ]
})
export default class Nabu {}
