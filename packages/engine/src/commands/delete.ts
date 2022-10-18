import { makeQueryPipeline } from "../aggregation";
import { ChangeStreamDocument } from "../changeStream";
import { AggregationEngine } from "../aggregation";
import { Document } from "../interfaces";
import { WriteCommand } from "./write";
import { QueryEngine } from "../query";

export abstract class DeleteCommand extends WriteCommand {
  public constructor(private deletes: Document[], ns: {db: string, coll: string}) {
    super('delete', ns);
  }

  public async execute(): Promise<ChangeStreamDocument<Document>[]> {
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
  public constructor(deletes: Document[], ns: any, private aggregation: AggregationEngine) { super(deletes, ns); }

  protected async onDelete({q, limit, collation}: Document) {
    const pipeline = makeQueryPipeline({filter: q, limit, projection: {_id: 1}});
    return this.aggregation.aggregate(this.ns.coll, pipeline, collation).toArray();
  }
}

export class QueryDeleteCommand extends DeleteCommand {
  public constructor(deletes: Document[], ns: any, private engine: QueryEngine) { super(deletes, ns); }

  protected async onDelete({q, limit, collation}: Document) {
    return this.engine.find(this.ns.coll, {filter: q, limit, projection: {_id: 1}}, collation).toArray();
  }
}
