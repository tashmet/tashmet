import { ChangeStreamDocument } from "@tashmet/bridge";
import ObjectID from "bson-objectid";
import { Document } from "../interfaces.js";


export abstract class WriteCommand {
  public constructor(
    public readonly op: 'insert' | 'delete' | 'update' | 'replace',
    protected ns: {db: string, coll: string}
  ) {}

  public abstract execute(): Promise<ChangeStreamDocument[]>;

  public createChanges(...documents: Document[]) {
    return documents.map(doc => makeWriteChange(this.op, doc, this.ns));
  }
}

export const makeWriteChange = (
  operationType: 'insert' | 'update' | 'replace' | 'delete',
  fullDocument: Document,
  ns: {db: string, coll: string
}): ChangeStreamDocument => ({
  _id: new ObjectID(),
  operationType,
  ns,
  documentKey: {_id: fullDocument._id},
  fullDocument: operationType !== 'delete' ? fullDocument : undefined,
});
