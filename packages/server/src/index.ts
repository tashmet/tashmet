import { Server } from "socket.io";

import { provider } from '@tashmet/core';
import { Store } from "@tashmet/tashmet";


@provider()
export default class TashmetServer {
  public constructor(private store: Store) {}

  public listen(port: number) {
    const io = new Server(port, { });

    console.log('listen on port: ' + port);

    io.on('connection', socket => {
      socket.onAny((event: string, cmd: Document, callback) => {
        const ns = event.split('.');
        this.store.command({db: ns[0], coll: ns[1]}, cmd).then(callback);
      });
    });
  }
}
