import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, StorageEngine, WriteOptions } from "../interfaces";

export async function writeChanges(
  storage: StorageEngine, db: DatabaseEngine, op: string, changes: ChangeStreamDocument[], options: WriteOptions
) {
  const writeErrors = await storage.write(changes, options);
  const successfulChanges = changes.filter((c, i) => !writeErrors.find(
    err => options.ordered ? i >= err.index : i === err.index)
  );

  let res: Document = { ok: 1, n: successfulChanges.length};

  if (writeErrors.length > 0) {
    res.writeErrors = writeErrors;
  }

  if (op === 'update') {
    res = {
      ...res,
      nModified: successfulChanges.filter(c => c.operationType !== 'insert').length,
      upserted: successfulChanges
        .filter(c => c.operationType === 'insert')
        .map((c, index) => ({index, _id: c.documentKey})),
    }
  }

  for (const c of successfulChanges) {
    db.emit('change', c);
  }

  return res;
}
