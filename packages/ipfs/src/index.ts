import {Factory} from '@tashmit/core';
import {FileAccessFactory} from '@tashmit/file';
import {IPFSService} from './ipfs';

const createClient = require('ipfs-http-client')

export function ipfs(url?: string): FileAccessFactory {
  return Factory.of(() => new IPFSService(createClient({url})));
}
