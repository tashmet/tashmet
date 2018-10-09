import {Transformer} from '@ziggurat/amelatu';
import {Injector} from '@ziggurat/tiamat';
import {CollectionConfig, SourceProducer} from '../database/interfaces';
import {RemoteCollection} from '../collections/remote';
import {Collection} from '../interfaces';
import * as io from 'socket.io-client';

export function remote(path: string): SourceProducer {
  return (injector: Injector, config: CollectionConfig): Collection => {
    const transformer = injector.get<Transformer>('amelatu.Transformer');
    let socket: any;
    if (typeof window !== 'undefined' && window.document) {
      socket = io.connect(window.location.origin);
    }
    return new RemoteCollection(path, config, transformer, socket);
  };
}
