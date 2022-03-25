/*
import {Collection, DatabaseEventEmitter} from '@tashmet/database';
import {EventEmitter} from 'eventemitter3';

const io = require('socket.io-client');


export class SocketEventEmitter extends EventEmitter implements DatabaseEventEmitter {
  public constructor(path: string, collection: Collection) {
    super();
    const socket = io.connect(path);
    socket.on('change', (change: any) => {
      this.emit('change', {action: change.action, data: change.data, collection});
    });
    socket.on('error', (err: any) => {
      this.emit('error', err);
    });
  }
}

export const socket = () =>
  (collection: Collection, path: string) => new SocketEventEmitter(path, collection);
*/
