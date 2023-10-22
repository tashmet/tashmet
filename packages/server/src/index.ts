import { Server as SocketIOServer} from "socket.io";
import { StorageEngine } from "@tashmet/engine";

export default class Server {
  private io: SocketIOServer;

  public constructor(private storageEngine: StorageEngine) {}

  public listen(port: number) {
    this.io = new SocketIOServer(port, { });

    this.io.on('connection', socket => {
      socket.onAny((event: string, cmd: Document, callback) => {
        const ns = event.split('.');
        this.storageEngine.command({db: ns[0], coll: ns[1]}, cmd).then(callback);
      });

      this.storageEngine.on('change', doc => socket.emit('change', doc));
    });
  }

  public close() {
    this.io.disconnectSockets()
    this.io.close();
  }
}
