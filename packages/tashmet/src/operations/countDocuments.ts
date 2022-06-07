import { Dispatcher, Document, Namespace } from "../interfaces";
import { AggregateOperation, AggregateOptions } from "./aggregate";

/** @public */
export interface CountDocumentsOptions extends AggregateOptions {
  /** The number of documents to skip. */
  skip?: number;
  /** The maximum amounts to count before aborting. */
  limit?: number;
}

/** @internal */
export class CountDocumentsOperation extends AggregateOperation<number> {
  constructor(ns: Namespace, query: Document, options: CountDocumentsOptions) {
    const pipeline = [];
    pipeline.push({ $match: query });

    if (typeof options.skip === 'number') {
      pipeline.push({ $skip: options.skip });
    }

    if (typeof options.limit === 'number') {
      pipeline.push({ $limit: options.limit });
    }

    pipeline.push({ $group: { _id: 1, n: { $sum: 1 } } });

    super(ns, pipeline, options);
  }

  async execute(dispatcher: Dispatcher): Promise<number> {
    const response = await super.execute(dispatcher) as unknown as Document;
    const docs = response.cursor.firstBatch;
    return docs.length ? docs[0].n : 0;
  }
}
