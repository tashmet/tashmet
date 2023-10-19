import { Document, Namespace, Store } from '@tashmet/tashmet';
import { io, Socket } from "socket.io-client";

export interface ClientConfig {
  uri: string;
}

export abstract class ClientConfig implements ClientConfig {}

export default class TashmetClient extends Store {
  private socket: Socket;

  public constructor(config: ClientConfig) {
    super();
    this.socket = io(config.uri);
  }

  public async command(ns: Namespace, command: Document): Promise<Document> {
    return new Promise<Document>(resolve => {
      this.socket.emit(`${ns.db}.${ns.coll}`, command, (res: Document) => {
        resolve(res);
      });
    });
  }
}
