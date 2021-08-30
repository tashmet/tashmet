import {component, Logger, Provider} from '@ziqquratu/core';
import {IPFSServiceFactory} from './ipfs';

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
  factories: [
    IPFSServiceFactory,
  ]
})
export default class IPFS {}
