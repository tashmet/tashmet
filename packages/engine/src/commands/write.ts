import ObjectID from "bson-objectid";
import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, StorageEngine } from "../interfaces";


export abstract class WriteCommand {
  public constructor(protected op: 'insert' | 'delete' | 'update' | 'replace', protected ns: {db: string, coll: string}) {}

  public abstract execute(): Promise<ChangeStreamDocument[]>;

  public async write(store: StorageEngine, db: DatabaseEngine, ordered: boolean): Promise<Document> {
    const changes = await this.execute();
    const writeErrors = await store.write(changes, {ordered});
    const successfulChanges = changes.filter((c, i) => !writeErrors.find(
      err => ordered ? i >= err.index : i === err.index)
    );

    let res: Document = { ok: 1, n: successfulChanges.length};

    if (writeErrors.length > 0) {
      res.writeErrors = writeErrors;
    }

    if (this.op === 'update') {
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

  public createChanges(...documents: Document[]) {
    return documents.map(doc => makeWriteChange(this.op, doc, this.ns));
  }
}

export const makeWriteChange = (
  operationType: 'insert' | 'update' | 'replace' | 'delete',
  fullDocument: Document,
  ns: {db: string, coll: string
}) => ({
  _id: new ObjectID(),
  operationType,
  ns,
  documentKey: fullDocument._id,
  fullDocument,
});
