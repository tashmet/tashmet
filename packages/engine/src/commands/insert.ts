import { ChangeStreamDocument, Document } from "@tashmet/tashmet";
import ObjectID from "bson-objectid";
import { WriteCommand } from "./write.js";

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
