import { Optional, provider } from "@tashmet/core";
import { StorageEngine, StorageEngineFactory } from "@tashmet/engine";
import { Document, Dispatcher, Namespace, CommandFunction, Middleware } from "./interfaces.js";


@provider({
  inject: [Optional.of(StorageEngineFactory)]
})
export class DefaultDispatcher extends Dispatcher {
  private engines: Record<string, StorageEngine> = {};
  private middleware: Middleware[] = [];


  private handler: CommandFunction = ({db}, cmd) => {
    let engine = this.engines[db];

    if (!engine) {
      if (!this.engineFactory) {
        throw new Error('No default storage engine factory registered');
      }
      engine = this.engines[db] = this.engineFactory.createStorageEngine(db);
      engine.on('change', change => this.emit('change', change));
    }

    return engine.command(cmd);
  }

  public constructor(private engineFactory: StorageEngineFactory | undefined) { super(); }

  dispatch(ns: Namespace, command: Document): Promise<Document> {
    let handler = this.handler;

    for (const middleware of this.middleware) {
      handler = middleware(handler);
    }

    return handler(ns, command);
  }

  public addStorageEngine(engine: StorageEngine) {
    this.engines[engine.databaseName] = engine;
  }

  public addMiddleware(middleware: Middleware) {
   this.middleware.unshift(middleware);
  }
}
