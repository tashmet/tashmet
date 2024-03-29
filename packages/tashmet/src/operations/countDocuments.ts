import { Document, TashmetProxy } from "../interfaces.js";
import { TashmetCollectionNamespace, TashmetNamespace } from "../utils.js";
import { AggregateOptions } from "./aggregate.js";
import { CommandOperation } from "./command.js";

/** @public */
export interface CountDocumentsOptions extends AggregateOptions {
  /** The number of documents to skip. */
  skip?: number;
  /** The maximum amounts to count before aborting. */
  limit?: number;
}

/** @internal */
export class CountDocumentsOperation extends CommandOperation<number> {
  public options: CountDocumentsOptions;

  constructor(ns: TashmetCollectionNamespace, private query: Document, options: CountDocumentsOptions) {
    super(ns, options);
  }

  async execute(proxy: TashmetProxy): Promise<number> {
    const cmd: Document = {count: this.ns.collection, query: this.query};

    if (this.options.skip) {
      cmd.skip = this.options.skip;
    }
    if (this.options.limit) {
      cmd.limit = this.options.limit;
    }

    const {n} = await this.executeCommand(proxy, cmd);
    return n;
  }
}
