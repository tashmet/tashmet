import { CollationSpec } from 'mingo/core';
import { AggregatorFactory, DatabaseEngine, Document, makeWriteChange, StorageEngine, Streamable } from '../interfaces';

export function makeUpdateCommand(store: StorageEngine & Streamable, aggFact: AggregatorFactory) { 
  return async ({update: collName, updates, ordered}: Document, db: DatabaseEngine) => {
    let nModified = 0;
    let n = 0;
    let upserted: Document[] = [];
    const coll = store.stream(collName);

    const aggregate = (pipeline: Document[], collation?: CollationSpec): Promise<Document[]> => {
      return aggFact.createAggregator(pipeline, {collation}).run(coll);
    }

    for (const {q, u, upsert, multi, collation} of updates) {
      let operation: 'update' | 'replace' = 'update';
      let pipeline: Document[] = [];

      if (Array.isArray(u)) {
        pipeline = u;
      } else if (Object.keys(u)[0].charAt(0) === '$') {
        pipeline = Object.entries(u).reduce<Document[]>((acc, [k, v]) => acc.concat([{[k]: v}]), []);
      } else {
        pipeline = [
          {$project: {'_id': 1}},
          {$set: u}
        ];
        operation = 'replace';
      }

      if (multi !== true) {
        pipeline.unshift({$limit: 1});
      }
      let output = await aggregate([{$match: q || {}}, ...pipeline], collation);

      if (output.length === 0 && upsert) {
        output = await aggFact
          .createAggregator(pipeline, {collation})
          .run(genEmptyDoc());
      }

      for (const doc of output) {
        if (!await store.exists(collName, doc._id)) {
          if (upsert) {
            await db.command({insert: collName, documents: [doc]});
            upserted.push({index: upserted.length, _id: doc._id});
            n++;
          }
        } else {
          await store.replace(collName, doc._id, doc);
          db.emit('change', makeWriteChange(operation, doc, {db: db.databaseName, coll: collName}));
          n++;
          nModified++;
        }
      }
    }
    return {ok: 1, n, nModified, upserted};
  }
}

async function *genEmptyDoc() {
  yield {};
}
