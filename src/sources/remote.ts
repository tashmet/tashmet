import {Transformer} from '@ziggurat/amelatu';
import {Injector} from '@ziggurat/tiamat';
import {CollectionConfig, SourceProducer} from '../database/interfaces';
import {RemoteCollection} from '../collections/remote';
import {Collection} from '../interfaces';
import * as io from 'socket.io-client';

export function remote(path: string, socket?: SocketIOClient.Socket): SourceProducer {
  return (injector: Injector, config: CollectionConfig): Collection => {
    const transformer = injector.get<Transformer>('amelatu.Transformer');
    return new RemoteCollection(path, config, transformer, socket);
  };
}
