import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, makeWriteChange, StorageEngine } from "../interfaces";
import { AbstractQueryEngine } from "../query";
import { writeChanges } from "./write";

export async function makeDeleteChanges(
  deletes: Document[], ns: {db: string, coll: string}, query: AbstractQueryEngine
) {
  const changes: ChangeStreamDocument[] = [];

  for (const {q, limit, collation} of deletes) {
    const cursor = query.find(ns.coll, {filter: q, limit}, collation);
    const matched = await cursor.toArray();
    changes.push(...matched.map(doc => makeWriteChange('delete', doc, ns)));

    query.closeCursor(cursor);
  }
  return changes;
}

export function makeDeleteCommand(storage: StorageEngine, query: AbstractQueryEngine) {
  return async ({delete: coll, deletes, ordered}: Document, db: DatabaseEngine) => {
    const changes = await makeDeleteChanges(deletes, {db: db.databaseName, coll}, query);
    return writeChanges(storage, db, 'delete', changes, {ordered});
  }
}
