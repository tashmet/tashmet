import { CollationOptions, Document, TashmetCollectionNamespace } from "@tashmet/tashmet";
import { Logger, provider } from "@tashmet/core";
import { Cursor, CursorRegistry, IteratorCursor } from "./cursor.js";
import { Store } from "./store.js";
import { AggregatorFactory, CollectionFactory } from "./interfaces.js";

export async function *arrayToGenerator<T>(array: T[]) {
  for (const item of array) {
    yield item;
  }
}

@provider({
  inject: [Store, Logger.inScope('QueryPlanner')]
})
export class QueryPlanner {
  public constructor(
    private store: Store,
    private logger: Logger,
  ) {}

  public resolveDocuments(qa: QueryAnalysis): AsyncIterable<Document> {
    let documentIds: string[] | undefined;

    const id = qa.filter._id;

    if (typeof id === 'string') {
      documentIds = [id];
    } else if (Array.isArray(id)) {
      documentIds = id;
    }
    this.logger.debug(`stream collection '${qa.ns.db}.${qa.ns.collection}' on ids: '${documentIds}'`)
    return this.store
      .getCollection(qa.ns)
      .read({
        documentIds,
        projection: Object.keys(qa.filter).length === 0 || qa.filter._id !== undefined ? qa.projection : undefined,
      });
  }
}

@provider()
export class AggregationEngine extends CursorRegistry {
  public constructor(
    private aggFact: AggregatorFactory,
    private queryPlanner: QueryPlanner,
    private store: Store,
    private collFactory: CollectionFactory,
  ) { super(); }

  public aggregate(
    db: string,
    collection: string | Document[] | AsyncIterable<Document>,
    pipeline: Document[],
    collation: CollationOptions | undefined,
  ): Cursor {
    let input: AsyncIterable<Document>;
    const qa = QueryAnalysis.fromPipeline(
      new TashmetCollectionNamespace(db, typeof collection === 'string' ? collection : ''),
      pipeline
    );

    if (qa.merge && !this.store.hasCollection(qa.merge)) {
      this.store.addCollection(this.collFactory.createCollection(qa.merge, {}));
    }
    if (qa.out && !this.store.hasCollection(qa.out)) {
      this.store.addCollection(this.collFactory.createCollection(qa.out, {}));
    }

    if (typeof collection === 'string') {
      input = this.queryPlanner.resolveDocuments(qa);
    } else if (Array.isArray(collection)) {
      input = arrayToGenerator(collection);
    } else {
      input = collection;
    }

    const aggregator = this.aggFact.createAggregator(pipeline, {
      collation,
      queryAnalysis: qa,
    });
    const output = aggregator.stream<Document>(input);

    return this.addCursor(
      new IteratorCursor(output[Symbol.asyncIterator](), ++this.cursorCounter)
    );
  }
}

export class QueryAnalysis {
  public static fromPipeline(ns: TashmetCollectionNamespace, pipeline: Document[]): QueryAnalysis {
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


    return new QueryAnalysis(ns, pipeline, filter, options.projection);
  }

  public constructor(
    public readonly ns: TashmetCollectionNamespace,
    public readonly pipeline: Document[],
    public readonly filter: Document,
    public readonly projection: Document,
  ) {}

  public get foreignInputs(): TashmetCollectionNamespace[] {
    const output: TashmetCollectionNamespace[] = [];
    for (let i = 0; i < this.pipeline.length; i++) {
      const step = this.pipeline[i];
      const op = Object.keys(step)[0];

      switch (op) {
        case '$lookup':
          output.push(this.toNamespace(step.$lookup.from));
          break;
        case '$merge':
          output.push(this.toNamespace(step.$merge.into));
          break;
        case '$out':
          output.push(this.toNamespace(step.$out));
          break;
      }
    }
    return output;
  }

  public get out(): TashmetCollectionNamespace | undefined {
    const lastStep = this.lastStep();

    if (lastStep && Object.keys(lastStep)[0] === '$out') {
      return this.toNamespace(lastStep.$out);
    }
    return undefined;
  }

  public get merge(): TashmetCollectionNamespace | undefined {
    const lastStep = this.lastStep();

    if (lastStep && Object.keys(lastStep)[0] === '$merge') {
      return this.toNamespace(lastStep.$merge.into);
    }
    return undefined;
  }

  private lastStep(): any {
    return this.pipeline.length > 0
      ? this.pipeline[this.pipeline.length - 1]
      : undefined;
  }

  public toNamespace(source: string | TashmetCollectionNamespace) {
    return typeof source === 'string'
      ? new TashmetCollectionNamespace(this.ns.db, source)
      : source;
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