// export {ipfs, ipfsDirectory, IPFSConfig} from './collections/ipfs';

import {component, Logger, Provider} from '@ziqquratu/core';
// import {IPFSFactory} from './collections/ipfs';
// import ipfsClient from 'ipfs-http-client';

@component({
  providers: [
    Provider.ofFactory({
      key: 'ipfs.Logger',
      inject: ['ziqquratu.Logger'],
      create: (logger: Logger) => logger.inScope('ipfs')
    }),
  ],
})
export default class IPFS {}
