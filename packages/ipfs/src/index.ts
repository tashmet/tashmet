export {ipfsDirectory, IPFSConfig} from './collections/directory';

import {component, Logger, Provider} from '@ziqquratu/core';
import {IPFSStreamFactory} from './collections/directory';

const createClient = require('ipfs-http-client')


@component({
  providers: [
    Provider.ofFactory({
      key: 'ipfs.Logger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('ipfs')
    }),
    Provider.ofFactory({
      key: 'ipfs.Client',
      create: () => createClient(),
    })
  ],
  factories: [
    IPFSStreamFactory,
  ]
})
export default class IPFS {}
