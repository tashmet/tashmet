import { CollationSpec } from 'mingo/core';
import { ChangeStreamDocument } from '../changeStream';
import { AggregatorFactory, DatabaseEngine, Document, makeWriteChange, StorageEngine, Streamable } from '../interfaces';
import { makeInsertChanges } from './insert';
import { writeChanges } from './write';

export async function makeUpdateChanges(
  updates: Document[], ns: {db: string, coll: string}, store: StorageEngine & Streamable, aggFact: AggregatorFactory
) {
  const coll = store.stream(ns.coll);

  const aggregate = (pipeline: Document[], collation?: CollationSpec): Promise<Document[]> => {
    return aggFact.createAggregator(pipeline, {collation}).run(coll);
  }

  const changes: ChangeStreamDocument[] = [];

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
      if (!await store.exists(ns.coll, doc._id)) {
        if (upsert) {
          changes.push(...makeInsertChanges([doc], ns))
        }
      } else {
        changes.push(makeWriteChange(operation, doc, ns));
      }
    }
  }
  return changes;
}

export function makeUpdateCommand(store: StorageEngine & Streamable, aggFact: AggregatorFactory) { 
  return async ({update: coll, updates, ordered}: Document, db: DatabaseEngine) => {
    const changes = await makeUpdateChanges(updates, {db: db.databaseName, coll}, store, aggFact);
    return writeChanges(store, db, 'update', changes, {ordered});
  }
}

async function *genEmptyDoc() {
  yield {};
}
