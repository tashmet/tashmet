import { DatabaseCommandHandler, Document } from '../interfaces';

export const $aggregate: DatabaseCommandHandler 
  = async (engine, {aggregate: coll, pipeline, cursor, collation}: Document) =>
{
  const c = engine.openCursor(coll, pipeline, collation);
  return {
    cursor: {
      firstBatch: await c.getBatch(cursor ? cursor.batchSize: undefined) ,
      id: c.id,
      ns: {db: engine.store.databaseName, coll},
    },
    ok: 1,
  }
}
