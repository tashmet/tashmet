import { CollationOptions, Document, TashmetCollectionNamespace } from "@tashmet/tashmet";
import { provider } from "@tashmet/core";
import { Cursor, CursorRegistry, IteratorCursor } from "./cursor.js";
import { Store } from "./store.js";
import { AggregatorFactory, arrayToGenerator, CollectionFactory } from "./interfaces.js";
import { QueryPlanner } from "./plan.js";

@provider()
export class AggregationEngine extends CursorRegistry {
  constructor(
    private aggFact: AggregatorFactory,
    private queryPlanner: QueryPlanner,
    private store: Store,
    private collFactory: CollectionFactory,
  ) { super(); }

  aggregate(
    db: string,
    collection: string | Document[] | AsyncIterable<Document>,
    pipeline: Document[],
    collation: CollationOptions | undefined,
  ): Cursor {
    let input: AsyncIterable<Document>;
    const plan = this.queryPlanner.createPlan(
      new TashmetCollectionNamespace(db, typeof collection === 'string' ? collection : ''),
      pipeline
    );
    const out = plan.out || plan.merge;

    if (out && !this.store.hasCollection(out)) {
      this.store.addCollection(this.collFactory.createCollection(out, {}));
    }

    if (typeof collection === 'string') {
      input = this.queryPlanner.resolveDocuments(plan);
    } else if (Array.isArray(collection)) {
      input = arrayToGenerator(collection);
    } else {
      input = collection;
    }

    const aggregator = this.aggFact.createAggregator(pipeline, { collation, plan });
    const output = aggregator.stream<Document>(input);

    return this.addCursor(
      new IteratorCursor(output[Symbol.asyncIterator](), ++this.cursorCounter)
    );
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
