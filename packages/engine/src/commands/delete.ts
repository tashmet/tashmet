import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, StorageEngine } from "../interfaces";
import { AbstractQueryEngine } from "../query";
import { WriteCommand } from "./write";

class DeleteCommand extends WriteCommand {
  public constructor(private deletes: Document[], ns: {db: string, coll: string}, private query: AbstractQueryEngine) {
    super('delete', ns);
  }

  public async execute(): Promise<ChangeStreamDocument<Document>[]> {
    const changes: ChangeStreamDocument[] = [];

    for (const {q, limit, collation} of this.deletes) {
      const cursor = this.query.find(this.ns.coll, {filter: q, limit}, collation);
      changes.push(...this.createChanges(...await cursor.toArray()))
      this.query.closeCursor(cursor);
    }
    return changes;
  }
}

export function makeDeleteCommand(store: StorageEngine, query: AbstractQueryEngine) {
  return async ({delete: coll, deletes, ordered}: Document, db: DatabaseEngine) =>
    new DeleteCommand(deletes, {db: db.databaseName, coll}, query).write(store, db, ordered);
}
