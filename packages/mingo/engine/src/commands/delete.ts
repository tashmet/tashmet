import { Document, DatabaseCommandHandler, makeWriteChange } from '../interfaces';
import { makeQueryPipeline } from './common';


export const $delete: DatabaseCommandHandler 
  = async (engine, {delete: coll, deletes}: Document) =>
{
  let n = 0;

  if (engine.isView(coll)) {
    return { ok: 1, n: 0, writeErrors: [
      {
        index: 0,
        code: 96,
        errMsg: 'cannot delete from a view',
      }
    ]};
  }

  for (const {q, limit, collation} of deletes) {
    const pipeline = makeQueryPipeline({filter: q, limit});
    const cursor = engine.openCursor(coll, pipeline, collation);

    const matched = await cursor.toArray();

    if (matched.length > 0) {
      for (const doc of matched) {
        await engine.store.delete(coll, doc._id);
        engine.emit('change', makeWriteChange('delete', doc, {db: engine.store.databaseName, coll}));
      }
    }

    n += matched.length;
    cursor.close();
  }

  return {n, ok: 1};
}
