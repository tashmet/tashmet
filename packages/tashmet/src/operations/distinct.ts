import { Collection } from "../collection";
import { Dispatcher, Document } from "../interfaces";
import { CommandOperation, CommandOperationOptions } from "./command";

/** @public */
export type DistinctOptions = CommandOperationOptions;

/**
 * Return a list of distinct values for the given key across a collection.
 * @internal
 */
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
    public collection: Collection,
    public key: string,
    public query: Document,
    public options: DistinctOptions = {}
  ) {
    super(collection, options);
  }

  async execute(dispatcher: Dispatcher): Promise<any[]> {
    const cmd: Document = {
      distinct: this.collection.collectionName,
      key: this.key,
      query: this.query,
    };

    const {values} = await this.executeCommand(dispatcher, cmd);
    return values;
  }
}