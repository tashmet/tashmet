import {component, Logger, Provider} from '@tashmit/core';

const createClient = require('ipfs-http-client')

@component({
  providers: [
    Provider.ofFactory({
      key: 'ipfs.Logger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('ipfs')
    }),
    Provider.ofFactory({
      key: 'ipfs.Client',
      create: () => createClient(),
    }),
  ],
})
export default class IPFS {}
