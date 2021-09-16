import {EventEmitter} from 'eventemitter3';

const io = require('socket.io-client');


export class SocketEventEmitter extends EventEmitter {
  public constructor(path: string) {
    super();
    const socket = io.connect(path);
    socket.on('change', (change: any) => {
      this.emit('change', {action: change.action, data: change.data});
    });
    socket.on('error', (err: any) => {
      this.emit('error', err);
    });
  }
}
