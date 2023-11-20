import { CollationOptions, Document, TashmetProxy } from "../interfaces.js";
import { TashmetNamespace } from "../utils.js";

export interface CommandOperationOptions {
  /** Collation */
  collation?: CollationOptions;

  maxTimeMS?: number;

  /** Should retry failed writes */
  retryWrites?: boolean;

  // Admin command overrides.
  dbName?: string;
  authdb?: string;
  noResponse?: boolean;
}

export abstract class CommandOperation<T> {
  constructor(public ns: TashmetNamespace, public options: CommandOperationOptions = {}) {}

  abstract execute(proxy: TashmetProxy): Promise<any>;

  executeCommand(proxy: TashmetProxy, cmd: Document): Promise<any> {
    return proxy.command(this.ns, cmd);
  }
}
