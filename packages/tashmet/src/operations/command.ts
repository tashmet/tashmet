import { CollationOptions, Document, Namespace, Store } from "../interfaces.js";

export interface CommandOperationOptions {
  /** Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported) */
  //readConcern?: ReadConcernLike;
  /** Collation */
  collation?: CollationOptions;
  maxTimeMS?: number;
  /**
   * Comment to apply to the operation.
   *
   * In server versions pre-4.4, 'comment' must be string.  A server
   * error will be thrown if any other type is provided.
   *
   * In server versions 4.4 and above, 'comment' can be any valid BSON type.
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
  constructor(public ns: Namespace, public options: CommandOperationOptions = {}) {}

  abstract execute(store: Store): Promise<any>;

  async executeCommand(store: Store, cmd: Document): Promise<any> {
    return store.command(this.ns, cmd);
  }
}
