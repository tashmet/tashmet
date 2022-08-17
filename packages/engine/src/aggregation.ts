import { Cursor, IteratorCursor } from "./cursor";
import { AggregatorFactory, CollationOptions, Document, Streamable, View } from "./interfaces";
import { AbstractQueryEngine, Queryable, QueryCursor } from "./query";

export class AggregationEngine extends AbstractQueryEngine {
  private views: Record<string, View> = {};

  public constructor(
    public readonly streamable: Streamable,
    public readonly aggFact: AggregatorFactory,
  ) {
    super();
  }

  public find(collName: string, query: Document, collation?: CollationOptions): Cursor {
    return this.aggregate(collName, makeQueryPipeline(query), collation);
  }

  public aggregate(collName: string, pipeline: Document[], collation?: CollationOptions) {
    let coll = this.read(collName);
    const it = this.aggFact
      .createAggregator(pipeline, {collation})
      .stream<Document>(coll);

    return this.addCursor(
      new IteratorCursor(it[Symbol.asyncIterator](), ++this.cursorCounter)
    );
  }

  public createView(name: string, view: View) {
    this.views[name] = view;
  }

  public isView(collection: string) {
    return !!this.views[collection];
  }

  public read(collection: string): AsyncIterable<Document> {
    const view = this.views[collection];

    if (view) {
      return this.aggFact
        .createAggregator(view.pipeline, {})
        .stream(this.read(view.viewOn));
    }
    return this.streamable.stream(collection);
  }
}

export interface PrefetchAggregationStrategy {
  filter: Document;
  options: Document;
  pipeline: Document[];
}

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
    const strategy = this.createPrefetchStrategy(pipeline);

    const cursor = this.find(collName, {filter: strategy.filter, ...strategy.options}, collation);

    return cursor;
  }

  private createPrefetchStrategy(pipeline: Document[]): PrefetchAggregationStrategy {
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