import { Collection } from "../collection";
import { Dispatcher, Document } from "../interfaces";
import { CommandOperation, CommandOperationOptions } from "./command";

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
   * getMore only supports 'comment' in server versions 4.4 and above.
   */
  comment?: unknown;
  /** Number of milliseconds to wait before aborting the query. */
  maxTimeMS?: number;
}

/** @internal */
export class GetMoreOperation extends CommandOperation<Document> {
  constructor(
    public collection: Collection,
    public cursorId: number,
    public options: GetMoreOptions = {}
  ) { super(collection, options); }

  execute(dispatcher: Dispatcher): Promise<Document> {
    return this.executeCommand(dispatcher, {
      getMore: this.cursorId,
      collection: this.collection.collectionName,
      batchSIze: this.options.batchSize,
    });
  }
}
