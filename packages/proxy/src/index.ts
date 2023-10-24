import { Document, Namespace, TashmetProxy } from '@tashmet/tashmet';
import { io, Socket } from "socket.io-client";

export interface ServerProxyConfig {
  uri: string;
}

export abstract class ServerProxyConfig implements ServerProxyConfig {}

/**
 * A tashmet proxy that forwards commands to a server over socket.
 */
export default class ServerProxy extends TashmetProxy {
  private socket: Socket;

  public constructor(private config: ServerProxyConfig) {
    super();
  }

  public connect() {
    this.socket = io(this.config.uri);
    this.socket.on('connect', () => {
      this.emit('connected');
      this.socket.on('change', doc => this.emit('change', doc));
    });
    return this;
  }

  public destroy(): void {
    this.socket.disconnect();
  }

  public async command(ns: Namespace, command: Document): Promise<Document> {
    return new Promise<Document>(resolve => {
      this.socket.emit(`${ns.db}.${ns.coll}`, command, (res: Document) => {
        resolve(res);
      });
    });
  }
}
