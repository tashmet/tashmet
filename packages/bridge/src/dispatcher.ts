import { Bridge, Document, Namespace, CommandFunction, Middleware, EventEmitter } from "./interfaces.js";

export class Dispatcher extends EventEmitter {
  private middleware: Middleware[] = [];
  private bridges: Map<string, Bridge>;

  public constructor() {
    super();
    this.bridges = new Map();
  }

  public dispatch(ns: Namespace, command: Document): Promise<Document> {
    let handler = this.handler;

    for (const middleware of this.middleware) {
      handler = middleware(handler);
    }

    return handler(ns, command);
  }

  public addBridge(database: string | string[], bridge: Bridge) {
    for (const db of Array.isArray(database) ? database : [database]) {
      this.bridges.set(db, bridge);
      bridge.on('change', change => this.emit('change', change));
    }
  }

  private handler: CommandFunction = ({db, coll}, cmd) => {
    let bridge = this.bridges.get(db);

    if (!bridge) {
      bridge = this.bridges.get('*');
    }

    if (!bridge) {
      throw Error('No default bridge found');
    }

    return bridge.command({db, coll}, cmd);
  }
}
