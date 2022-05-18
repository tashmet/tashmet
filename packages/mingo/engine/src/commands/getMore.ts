import { Document, DatabaseCommandHandler } from '../interfaces';

export const $getMore: DatabaseCommandHandler = async (engine, {getMore, collection, batchSize}: Document) => {
  const cursor = engine.getCursor(getMore);
  if (!cursor) throw new Error('Invalid cursor');
  return {
    cursor: {
      nextBatch: await cursor.getBatch(batchSize),
      id: getMore,
      ns: {db: engine.store.databaseName, coll: collection},
    },
    ok: 1,
  }
}
