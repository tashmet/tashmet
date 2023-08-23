import { CollationOptions, Dispatcher, Document, Namespace } from "../interfaces.js";
import { CommandOperation, CommandOperationOptions } from "./command.js";
import { Aspect, aspects } from "./operation.js";

/** @public */
export interface AggregateOptions extends CommandOperationOptions {
  /** allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 \>). */
  allowDiskUse?: boolean;
  /** The number of documents to return per batch. See [aggregation documentation](https://docs.mongodb.com/manual/reference/command/aggregate). */
  batchSize?: number;
  /** Allow driver to bypass schema validation in MongoDB 3.2 or higher. */
  bypassDocumentValidation?: boolean;
  /** Return the query as cursor, on 2.6 \> it returns as a real cursor on pre 2.6 it returns as an emulated cursor. */
  cursor?: Document;
  /** specifies a cumulative time limit in milliseconds for processing operations on the cursor. MongoDB interrupts the operation at the earliest following interrupt point. */
  maxTimeMS?: number;
  /** The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query. */
  maxAwaitTimeMS?: number;
  /** Specify collation. */
  collation?: CollationOptions;
  /** Add an index selection hint to an aggregation command */
  //hint?: Hint;
  /** Map of parameter names and values that can be accessed using $$var (requires MongoDB 5.0). */
  //let?: Document;

  out?: string;
}

/** @internal */
@aspects(Aspect.READ_OPERATION, Aspect.RETRYABLE, Aspect.EXPLAINABLE, Aspect.CURSOR_CREATING)
export class AggregateOperation<T = Document> extends CommandOperation<T> {
  options: AggregateOptions;
  target: string | 1;
  pipeline: Document[];
  hasWriteStage: boolean;

  constructor(ns: Namespace, pipeline: Document[], options?: AggregateOptions) {
    super(ns, { ...options, dbName: ns.db });

    this.options = options ?? {};

    // Covers when ns.collection is null, undefined or the empty string, use DB_AGGREGATE_COLLECTION
    this.target = ns.coll || 1;

    this.pipeline = pipeline;

    // determine if we have a write stage, override read preference if so
    this.hasWriteStage = false;
    if (typeof options?.out === 'string') {
      this.pipeline = this.pipeline.concat({ $out: options.out });
      this.hasWriteStage = true;
    } else if (pipeline.length > 0) {
      const finalStage = pipeline[pipeline.length - 1];
      if (finalStage.$out || finalStage.$merge) {
        this.hasWriteStage = true;
      }
    }
  }

  addToPipeline(stage: Document): void {
    this.pipeline.push(stage);
  }

  execute(dispatcher: Dispatcher): Promise<T> {
    const options: AggregateOptions = this.options;
    const command: Document = { aggregate: this.target, pipeline: this.pipeline };

    if (options.bypassDocumentValidation === true) {
      command.bypassDocumentValidation = options.bypassDocumentValidation;
    }

    if (typeof options.allowDiskUse === 'boolean') {
      command.allowDiskUse = options.allowDiskUse;
    }

    command.cursor = options.cursor || {};
    if (options.batchSize && !this.hasWriteStage) {
      command.cursor.batchSize = options.batchSize;
    }

    return super.executeCommand(dispatcher, command);
  }
}
