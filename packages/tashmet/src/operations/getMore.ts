import { Document, Namespace, TashmetProxy } from "../interfaces.js";
import { CommandOperation, CommandOperationOptions } from "./command.js";

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface GetMoreOptions extends CommandOperationOptions {
  /** Set the batchSize for the getMoreCommand when iterating over the query results. */
  batchSize?: number;
  /**
   * Comment to apply to the operation.
   *
   * getMore only supports 'comment' in proxy versions 4.4 and above.
   */
  comment?: unknown;
  /** Number of milliseconds to wait before aborting the query. */
  maxTimeMS?: number;
}

/** @internal */
export class GetMoreOperation extends CommandOperation<Document> {
  constructor(
    ns: Namespace,
    public cursorId: number,
    public options: GetMoreOptions = {}
  ) { super(ns, options); }

  execute(proxy: TashmetProxy): Promise<Document> {
    return this.executeCommand(proxy, {
      getMore: this.cursorId,
      collection: this.ns.coll,
      batchSize: this.options.batchSize,
    });
  }
}
