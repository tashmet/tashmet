import { Collection } from "../collection";
import { Document } from "../interfaces";

export function prepareDocs(
  coll: Collection,
  docs: Document[],
  options: { forceServerObjectId?: boolean }
): Document[] {
  const forceServerObjectId =
    typeof options.forceServerObjectId === 'boolean'
      ? options.forceServerObjectId
      : coll.db.options.forceServerObjectId;

  // no need to modify the docs if server sets the ObjectId
  if (forceServerObjectId === true) {
    return docs;
  }

  return docs.map(doc => {
    if (doc._id == null) {
      doc._id = coll.pkFactory.createPk();
    }

    return doc;
  });
}
