import { Dispatcher, Document, Namespace } from "../interfaces";
import { CommandOperation, CommandOperationOptions } from "./command";
import { Aspect, aspects } from "./operation";

/** @public */
export type DistinctOptions = CommandOperationOptions;

/**
 * Return a list of distinct values for the given key across a collection.
 * @internal
 */
@aspects(Aspect.READ_OPERATION, Aspect.RETRYABLE, Aspect.EXPLAINABLE)
export class DistinctOperation extends CommandOperation<any[]> {
  /**
   * Construct a Distinct operation.
   *
   * @param collection - Collection instance.
   * @param key - Field of the document to find distinct values for.
   * @param query - The query for filtering the set of documents to which we apply the distinct filter.
   * @param options - Optional settings. See Collection.prototype.distinct for a list of options.
   */
  constructor(
    public ns: Namespace,
    public key: string,
    public query: Document,
    public options: DistinctOptions = {}
  ) {
    super(ns, options);
  }

  async execute(dispatcher: Dispatcher): Promise<any[]> {
    const cmd: Document = {
      distinct: this.ns.coll,
      key: this.key,
      query: this.query,
    };

    const {values} = await this.executeCommand(dispatcher, cmd);
    return values as unknown as any[];
  }
}