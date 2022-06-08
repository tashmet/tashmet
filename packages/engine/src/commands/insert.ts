import { DatabaseEngine, Document, makeWriteChange, StorageEngine } from "../interfaces";

export function makeInsertCommand(storage: StorageEngine) {
  return async ({insert: coll, documents, ordered}: Document, db: DatabaseEngine) => {
    let writeErrors: any[] = [];
    let n = 0;

    for (let i = 0; i < documents.length; i++) {
      try {
        await storage.insert(coll, documents[i]);
        db.emit('change', makeWriteChange('insert', documents[i], {db: db.databaseName, coll}));
        n++;
      } catch (error) {
        writeErrors.push({index: i, errMsg: error.message});
        if (ordered) {
            break;
        }
      }
    }
    return writeErrors.length === 0 
        ? { n, ok: 1 }
        : { n, ok: 1, writeErrors }
  }
}