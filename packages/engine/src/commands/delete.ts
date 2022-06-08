import { DatabaseEngine, Document, makeWriteChange, StorageEngine } from "../interfaces";
import { QueryEngine } from "../query";


export function makeDeleteCommand(storage: StorageEngine, query: QueryEngine) {
  return async ({delete: coll, deletes}: Document, db: DatabaseEngine) => {
    let n = 0;
/*
    if (engine.isView(coll)) {
      return { ok: 1, n: 0, writeErrors: [
        {
          index: 0,
          code: 96,
          errMsg: 'cannot delete from a view',
        }
      ]};
    }
    */

    for (const {q, limit, collation} of deletes) {
      const cursor = query.find(coll, {filter: q, limit}, collation);
      const matched = await cursor.toArray();

      if (matched.length > 0) {
        for (const doc of matched) {
          await storage.delete(coll, doc._id);
          db.emit('change', makeWriteChange('delete', doc, {db: db.databaseName, coll}));
        }
      }

      n += matched.length;
      cursor.close();
    }

    return {n, ok: 1};
  }
}
