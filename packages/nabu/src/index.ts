export {shards, ShardStreamConfig, ShardStreamFactory} from './collections/shard';
export {bundle, BundleConfig, BundleStreamFactory} from './collections/bundle';
export * from './pipes';

import {component, Logger, Provider} from '@ziqquratu/core';
import {ShardBufferFactory} from './collections/shard';
import {BundleBufferFactory} from './collections/bundle';

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
