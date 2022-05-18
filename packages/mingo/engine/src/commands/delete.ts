import { Document, DatabaseCommandHandler } from '../interfaces';
import { makeQueryPipeline } from './common';


export const $delete: DatabaseCommandHandler 
  = async (engine, {delete: collName, deletes}: Document) =>
{
  let n = 0;

  for (const {q, limit, collation} of deletes) {
    const pipeline = makeQueryPipeline({q, limit});
    const cursor = engine.openCursor(collName, pipeline, collation);

    const matched = await cursor.toArray();

    if (matched.length > 0) {
      for (const doc of matched) {
        engine.store.delete(collName, doc._id);
      }
    }

    n += matched.length;
  }

  return {n, ok: 1};
}
