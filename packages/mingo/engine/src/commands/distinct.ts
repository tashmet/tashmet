import { DatabaseCommandHandler, Document } from '../interfaces';

export const $distinct: DatabaseCommandHandler = async (engine, {distinct: collName, key, query, collation}: Document) => {
  const pipeline: Document[] = [
    {$match: query || {}},
    {$unwind: `$${key}`},
    {$group: {_id: `$${key}`}},
  ]; 

  const c = engine.openCursor(collName, pipeline, collation);
  const values = (await c.toArray()).map(doc => doc._id);
  c.close();

  return {values, ok: 1};
}
