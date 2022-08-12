import ObjectID from "bson-objectid";
import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, makeWriteChange, StorageEngine } from "../interfaces";
import { writeChanges } from "./write";

export function makeInsertChanges(documents: Document[], ns: any): ChangeStreamDocument[] {
  for (const doc of documents) {
    if (!doc.hasOwnProperty('_id')) {
      doc._id = new ObjectID().toHexString();
    }
  }

  return documents.map(doc => makeWriteChange('insert', doc, ns));
}

export function makeInsertCommand(storage: StorageEngine) {
  return async ({insert: coll, documents, ordered}: Document, db: DatabaseEngine) =>
    writeChanges(storage, db, 'insert', makeInsertChanges(documents, {db: db.databaseName, coll}), {ordered});
}
