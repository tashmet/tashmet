import { CollationOptions, Document, TashmetProxy } from "../interfaces.js";
import { TashmetNamespace } from "../utils.js";

export interface CommandOperationOptions {
  /** Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported) */
  //readConcern?: ReadConcernLike;
  /** Collation */
  collation?: CollationOptions;
  maxTimeMS?: number;
  /**
   * Comment to apply to the operation.
   *
   * In proxy versions pre-4.4, 'comment' must be string.  A proxy
   * error will be thrown if any other type is provided.
   *
   * In proxy versions 4.4 and above, 'comment' can be any valid BSON type.
   */
  //comment?: unknown;
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

  async executeCommand(proxy: TashmetProxy, cmd: Document): Promise<any> {
    return proxy.command(this.ns, cmd);
  }
}
