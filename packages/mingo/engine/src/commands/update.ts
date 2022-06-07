import { CollationSpec, OperatorType } from 'mingo/core';
import { Document, DatabaseCommandHandler, makeWriteChange } from '../interfaces';

export const $update: DatabaseCommandHandler = async (engine, {update: collName, updates, ordered}: Document) => {
    let nModified = 0;
    let n = 0;
    let upserted: Document[] = [];
    const coll = engine.store.collection(collName);

    const aggregate = (pipeline: Document[], collation?: CollationSpec): Promise<Document[]> => {
      return engine.aggFact.createAggregator(pipeline, {collation}).run(coll);
    }
    let operation: 'update' | 'replace' = 'update';

    for (const {q, u, upsert, multi, collation} of updates) {
      let pipeline: Document[] = [];

      if (Array.isArray(u)) {
        pipeline = u;
      } else if (Object.keys(u)[0].charAt(0) === '$') {
        pipeline = Object.entries(u).reduce<Document[]>((acc, [k, v]) => acc.concat([{[k]: v}]), []);
      } else {
        pipeline = [{$set: u}];
        operation = 'replace';
      }

      if (multi !== true) {
        pipeline.unshift({$limit: 1});
      }
      let output = await aggregate([{$match: q || {}}, ...pipeline], collation);

      if (output.length === 0 && upsert) {
        output = await engine.aggFact
          .createAggregator(pipeline, {collation})
          .run(genEmptyDoc());
      }

      for (const doc of output) {
        if (!engine.store.exists(collName, doc._id)) {
          if (upsert) {
            await engine.command({insert: collName, documents: [doc]});
            upserted.push({index: upserted.length, _id: doc._id});
            n++;
          }
        } else {
          await engine.store.replace(collName, doc._id, doc);
          engine.emit('change', makeWriteChange(operation, doc, {db: engine.store.databaseName, coll: collName}));
          n++;
          nModified++;
        }
      }
    }
    return {ok: 1, n, nModified, upserted};
}

async function *genEmptyDoc() {
  yield {};
}
