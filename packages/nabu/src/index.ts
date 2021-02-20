import {component, Logger, Provider} from '@ziqquratu/core';
import {ShardBufferFactory} from './collections/shard';
import {BundleBufferFactory} from './collections/bundle';

export {shards, ShardStreamConfig, ShardStreamFactory} from './collections/shard';
export {bundle, BundleConfig, BundleStreamFactory} from './collections/bundle';
export {directory} from './collections/directory';
export {file} from './collections/file';
export * from './interfaces';
export * from './generator';
export * from './transform';
export * from './gates';
export * as Pipes from './pipes';

@component({
  providers: [
    Provider.ofFactory({
      key: 'nabu.Logger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('nabu')
    }),
  ],
  factories: [
    BundleBufferFactory,
    ShardBufferFactory,
  ]
})
export default class Nabu {}
