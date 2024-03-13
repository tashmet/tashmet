import { Server as SocketIOServer} from "socket.io";
import { StorageEngine } from "@tashmet/engine";
import { TashmetNamespace } from "@tashmet/tashmet";
import * as http from "http";

export default class Server {
  private io: SocketIOServer;

  public constructor(private storageEngine: StorageEngine, serverOrPort: http.Server | number) {
    this.io = new SocketIOServer(serverOrPort);
  }

  public listen() {
    this.io.on('connection', socket => {
      socket.onAny((event: string, cmd: Document, callback) => {
        this.storageEngine.command(new TashmetNamespace(event), cmd).then(callback);
      });

      this.storageEngine.on('change', doc => socket.emit('change', doc));
    });
  }

  public close() {
    this.io.disconnectSockets()
    this.io.close();
  }
}
