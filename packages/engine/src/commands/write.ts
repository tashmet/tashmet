import { ChangeStreamDocument, Document } from "@tashmet/tashmet";
import ObjectID from "bson-objectid";


export abstract class WriteCommand {
  constructor(
    public readonly op: 'insert' | 'delete' | 'update' | 'replace',
    protected ns: {db: string, coll: string}
  ) {}

  abstract execute(): Promise<ChangeStreamDocument[]>;

  createChanges(...documents: Document[]) {
    return documents.map(doc => makeWriteChange(this.op, doc, this.ns));
  }
}

export const makeWriteChange = (
  operationType: 'insert' | 'update' | 'replace' | 'delete',
  fullDocument: Document,
  ns: {db: string, coll: string
}): ChangeStreamDocument => ({
  _id: new ObjectID().toHexString(),
  operationType,
  ns,
  documentKey: {_id: fullDocument._id},
  fullDocument: operationType !== 'delete' ? fullDocument : undefined,
});
