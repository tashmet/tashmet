import { Logger } from "@tashmet/core";
import { Cursor, CursorRegistry, IteratorCursor } from "./cursor.js";
import { AggregatorFactory, CollationOptions, Document, Streamable } from "./interfaces.js";

export async function *arrayToGenerator<T>(array: T[]) {
  for (const item of array) {
    yield item;
  }
}

export class AggregationEngine extends CursorRegistry {
  public constructor(
    private aggFact: AggregatorFactory,
    private queryPlanner: QueryPlanner,
    private options: Document = {},
  ) { super(); }

  public aggregate(
    collection: string | Document[] | AsyncIterable<Document>,
    pipeline: Document[],
    collation: CollationOptions | undefined,
  ): Cursor {
    let input: AsyncIterable<Document>;

    if (typeof collection === 'string') {
      input = this.queryPlanner.resolveDocuments(collection, pipeline);
    } else if (Array.isArray(collection)) {
      input = arrayToGenerator(collection);
    } else {
      input = collection;
    }

    const aggregator = this.aggFact.createAggregator(pipeline, {collation, ...this.options});
    const output = aggregator.stream<Document>(input);

    return this.addCursor(
      new IteratorCursor(output[Symbol.asyncIterator](), ++this.cursorCounter)
    );
  }
}

export class QueryPlanner {
  public constructor(
    private documentReader: Streamable,
    private logger: Logger,
  ) {}

  public resolveDocuments(collection: string, pipeline: Document[]): AsyncIterable<Document> {
    let documentIds: string[] | undefined;

    if (pipeline.length > 0) {
      const stage1 = pipeline[0];

      const id = stage1.$match?._id;

      if (typeof id === 'string') {
        documentIds = [id];
      } else if (Array.isArray(id)) {
        documentIds = id;
      }
    }
    this.logger.debug(`stream collection '${collection}' on ids: '${documentIds}'`)
    return this.documentReader.stream(collection, documentIds);
  }
}

export interface PrefetchAggregationStrategy {
  filter: Document;
  options: Document;
  pipeline: Document[];
}

export function makePrefetchStrategy(pipeline: Document[]) {
    let filter: Document = {};
    let options: Document = {};

    const handlers: Record<string, (value: any) => void> = {
      '$match': v => filter = v,
      '$sort': v => options.sort = v,
      '$skip': v => options.skip = v,
      '$limit': v => options.limit = v,
      '$project': v => options.projection = v,
    }

    const allAllowed = ['$match', '$sort', '$skip', '$limit', '$project'];
    const allowPreceding: Record<string, string[]> = {
      '$match': [],
      '$sort': ['$match'],
      '$skip': allAllowed,
      '$limit': allAllowed,
      '$project': allAllowed,
    };

    let prevStepOps: string[] = [];

    const isValid = (op: string) =>
      op in handlers && prevStepOps.every(prevOp => allowPreceding[op].includes(prevOp));

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const op = Object.keys(step)[0];
      if (isValid(op)) {
        handlers[op](step[op]);
        prevStepOps.push(op);
      } else {
        break;
      }
    }

    return {filter, options, pipeline: pipeline.slice(prevStepOps.length)};
}

/*
export class PrefetchAggregationEngine extends AggregationEngine {
  public constructor(
    streamable: Streamable,
    aggFact: AggregatorFactory,
    private queryable: Queryable
  ) { super(streamable, aggFact); }

  public find(collName: string, query: Document, collation?: CollationOptions): Cursor {
    return this.addCursor(
      new QueryCursor(this.queryable, collName, {...query, collation}, ++this.cursorCounter)
    );
  }

  public aggregate(collName: string, pipeline: Document[], collation?: CollationOptions) {
    const {filter, options, pipeline: outputPipeline} = makePrefetchStrategy(pipeline);

    if (outputPipeline.length > 0) {
      throw new Error('Pipeline contains unsupported operators');
    }

    return this.find(collName, {filter: filter, ...options}, collation);
  }
}
*/

export const makeQueryPipeline = ({filter, sort, skip, limit, projection}: Document) => {
  const operators: Document[] = [];

  if (filter) operators.push({$match: filter});
  if (sort) operators.push({$sort: sort});
  if (skip) operators.push({$skip: skip});
  if (limit) operators.push({$limit: limit});
  if (projection) operators.push({$project: projection});

  return operators;
}