import { Cursor } from "./cursor";
import { AggregatorFactory, CollationOptions, Document, Streamable, View } from "./interfaces";
import { QueryEngine } from "./query";

export class AggregationEngine extends QueryEngine {
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

    const cursor = new Cursor(it[Symbol.asyncIterator](), ++this.cursorCounter, this);
    return this.cursors[this.cursorCounter] = cursor;
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

export const makeQueryPipeline = ({filter, sort, skip, limit, projection}: Document) => {
  const operators: Document[] = [];

  if (filter) operators.push({$match: filter});
  if (sort) operators.push({$sort: sort});
  if (skip) operators.push({$skip: skip});
  if (limit) operators.push({$limit: limit});
  if (projection) operators.push({$project: projection});

  return operators;
}