import {component, Logger, Provider} from '@tashmit/core';
import {ShardBufferFactory} from './collections/shard';
import {BundleBufferFactory} from './collections/bundle';

export {shards, ShardStreamConfig, ShardStreamFactory} from './collections/shard';
export {bundle, BundleConfig, BundleStreamFactory} from './collections/bundle';
export {directoryContent, directoryFiles} from './collections/directory';
export {globFiles, globContent} from './collections/glob';
export {file} from './collections/file';
export * from './interfaces';
export * from './pipeline';
export * from './transform';
export * from './gates';
export * as Pipes from './pipes';

@component({
  providers: [
    Provider.ofFactory({
      key: 'file.Logger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('file')
    }),
  ],
  factories: [
    BundleBufferFactory,
    ShardBufferFactory,
  ]
})
export default class File {}
