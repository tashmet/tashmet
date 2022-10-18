import ObjectID from "bson-objectid";
import { ChangeStreamDocument } from "../changeStream";
import { Document } from "../interfaces";
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
