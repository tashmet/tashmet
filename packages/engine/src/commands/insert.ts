import { ChangeStreamDocument, Document } from "@tashmet/tashmet";
import ObjectID from "bson-objectid";
import { WriteCommand } from "./write.js";

export class InsertCommand extends WriteCommand {
  constructor(private documents: Document[], ns: {db: string, coll: string}) {
    super('insert', ns);
  }

  async execute(): Promise<ChangeStreamDocument[]> {
    for (const doc of this.documents) {
      if (!('_id' in doc)) {
        doc._id = new ObjectID().toHexString();
      }
    }
    return this.createChanges(...this.documents);
  }
}
