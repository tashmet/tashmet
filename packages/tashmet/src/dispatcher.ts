import { provider } from "@tashmet/core";
import { Document, DatabaseEngine, DatabaseEngineFactory, Dispatcher, Namespace } from "./interfaces";

@provider()
export class DefaultDispatcher extends Dispatcher {
  private engines: Record<string, DatabaseEngine> = {};

  public constructor(private engineFactory: DatabaseEngineFactory) { super(); }

  dispatch(ns: Namespace, command: Document): Promise<Document> {
    let engine = this.engines[ns.db];

    if (!engine) {
      engine = this.engines[ns.db] = this.engineFactory.createDatabaseEngine(ns.db);
      engine.on('change', change => this.emit('change', change));
    }

    return engine.command(command);
  }
}
