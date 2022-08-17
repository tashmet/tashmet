import ObjectID from "bson-objectid";
import { ChangeStreamDocument } from "../changeStream";
import { DatabaseEngine, Document, StorageEngine } from "../interfaces";
import { WriteCommand } from "./write";

export class InsertCommand extends WriteCommand {
  public constructor(private documents: Document[], ns: {db: string, coll: string}) {
    super('insert', ns);
  }

  public async execute(): Promise<ChangeStreamDocument[]> {
    for (const doc of this.documents) {
      if (!doc.hasOwnProperty('_id')) {
        doc._id = new ObjectID().toHexString();
      }
    }
    return this.createChanges(...this.documents);
  }
}

export function makeInsertCommand(store: StorageEngine) {
  return async ({insert: coll, documents, ordered}: Document, db: DatabaseEngine) =>
    new InsertCommand(documents, {db: db.databaseName, coll}).write(store, db, ordered);
}
