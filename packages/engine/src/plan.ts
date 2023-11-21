import { Document, TashmetCollectionNamespace } from "@tashmet/tashmet";
import { Logger, provider } from "@tashmet/core";
import { Store } from "./store.js";


export class QueryPlan {
  public constructor(
    public readonly ns: TashmetCollectionNamespace,
    public readonly pipeline: Document[],
    public readonly filter: Document,
    public readonly projection: Document,
  ) {}

  /**
   * Get a list of namespaces to foreign collections that this query utilize.
   */
  get foreignCollections(): TashmetCollectionNamespace[] {
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

  /**
   * The namespace of the $out stage of the pipeline if there is one.
   */
  get out(): TashmetCollectionNamespace | undefined {
    const lastStep = this.lastStep();

    if (lastStep?.$out) {
      return this.toNamespace(lastStep.$out);
    }
    return undefined;
  }

  /**
   * The namespace of the $merge stage of the pipeline if there is one.
   */
  get merge(): TashmetCollectionNamespace | undefined {
    const lastStep = this.lastStep();

    if (lastStep?.$merge) {
      return this.toNamespace(lastStep.$merge.into);
    }
    return undefined;
  }

  toNamespace(source: string) {
    return source.includes('.')
      ? TashmetCollectionNamespace.fromString(source)
      : new TashmetCollectionNamespace(this.ns.db, source);
  }

  private lastStep(): any {
    return this.pipeline.length > 0
      ? this.pipeline[this.pipeline.length - 1]
      : undefined;
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

  public createPlan(ns: TashmetCollectionNamespace, pipeline: Document[]): QueryPlan {
    let filter: Document = {};
    const options: Document = {};

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

    const prevStepOps: string[] = [];

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

    return new QueryPlan(ns, pipeline, filter, options.projection);
  }

  public resolveDocuments(plan: QueryPlan): AsyncIterable<Document> {
    let documentIds: string[] | undefined;

    const id = plan.filter._id;

    if (typeof id === 'string') {
      documentIds = [id];
    } else if (Array.isArray(id)) {
      documentIds = id;
    }
    this.logger.debug(`stream collection '${plan.ns.db}.${plan.ns.collection}' on ids: '${documentIds}'`)
    return this.store
      .getCollection(plan.ns)
      .read({
        documentIds,
        projection: Object.keys(plan.filter).length === 0 || plan.filter._id !== undefined ? plan.projection : undefined,
      });
  }
}
