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
    const qa = QueryAnalysis.fromPipeline(pipeline);

    if (typeof collection === 'string') {
      input = this.queryPlanner.resolveDocuments(collection, qa);
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

  public resolveDocuments(collection: string, qa: QueryAnalysis): AsyncIterable<Document> {
    let documentIds: string[] | undefined;

    const id = qa.filter._id;

    if (typeof id === 'string') {
      documentIds = [id];
    } else if (Array.isArray(id)) {
      documentIds = id;
    }
    this.logger.debug(`stream collection '${collection}' on ids: '${documentIds}'`)
    return this.documentReader.stream(collection, {
      documentIds,
      projection: Object.keys(qa.filter).length === 0 || qa.filter._id !== undefined ? qa.projection : undefined,
    });
  }
}

export class QueryAnalysis {
  public static fromPipeline(pipeline: Document[]): QueryAnalysis {
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

    return new QueryAnalysis(pipeline, filter, options.projection);
  }

  public constructor(
    public readonly pipeline: Document[],
    public readonly filter: Document,
    public readonly projection: Document,
  ) {}
}

export const makeQueryPipeline = ({filter, sort, skip, limit, projection}: Document) => {
  const operators: Document[] = [];

  if (filter) operators.push({$match: filter});
  if (sort) operators.push({$sort: sort});
  if (skip) operators.push({$skip: skip});
  if (limit) operators.push({$limit: limit});
  if (projection) operators.push({$project: projection});

  return operators;
}