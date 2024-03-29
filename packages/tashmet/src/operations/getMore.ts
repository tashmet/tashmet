import { Document, TashmetProxy } from "../interfaces.js";
import { TashmetNamespace } from "../utils.js";
import { CommandOperation, CommandOperationOptions } from "./command.js";

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface GetMoreOptions extends CommandOperationOptions {
  /** Set the batchSize for the getMoreCommand when iterating over the query results. */
  batchSize?: number;

  /** Number of milliseconds to wait before aborting the query. */
  maxTimeMS?: number;
}

/** @internal */
export class GetMoreOperation extends CommandOperation<Document> {
  constructor(
    ns: TashmetNamespace,
    public cursorId: number,
    public options: GetMoreOptions = {}
  ) { super(ns, options); }

  execute(proxy: TashmetProxy): Promise<Document> {
    return this.executeCommand(proxy, {
      getMore: this.cursorId,
      collection: this.ns.collection || 1,
      batchSize: this.options.batchSize,
    });
  }
}
