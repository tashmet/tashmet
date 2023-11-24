import { ChangeStreamDocument, Document } from "@tashmet/tashmet";
import { AggregationEngine, makeQueryPipeline } from "../aggregation.js";
import { WriteCommand } from "./write.js";
import { QueryEngine } from "../query.js";

export abstract class DeleteCommand extends WriteCommand {
  constructor(private deletes: Document[], ns: {db: string, coll: string}) {
    super('delete', ns);
  }

  async execute(): Promise<ChangeStreamDocument<Document>[]> {
    const changes: ChangeStreamDocument[] = [];

    for (const {q, limit, collation} of this.deletes) {
      const docs = await this.onDelete({q, limit, collation});
      changes.push(...this.createChanges(...docs));
    }
    return changes;
  }

  protected abstract onDelete({q, limit, collation}: Document): Promise<Document[]>;
}

export class AggregationDeleteCommand extends DeleteCommand {
  constructor(deletes: Document[], ns: any, private aggregation: AggregationEngine) { super(deletes, ns); }

  protected async onDelete({q, limit, collation}: Document) {
    const pipeline = makeQueryPipeline({filter: q, limit, projection: {_id: 1}});
    return this.aggregation.aggregate(this.ns.db, this.ns.coll, pipeline, collation).toArray();
  }
}

export class QueryDeleteCommand extends DeleteCommand {
  constructor(deletes: Document[], ns: any, private engine: QueryEngine) { super(deletes, ns); }

  protected async onDelete({q, limit, collation}: Document) {
    return this.engine.find(this.ns.coll, {filter: q, limit, projection: {_id: 1}}, collation).toArray();
  }
}
