import { Document, DatabaseCommandHandler } from '../interfaces';
import { makeQueryPipeline } from './common';

export const $count: DatabaseCommandHandler
  = async (engine, {count: collName, query: filter, sort, skip, limit, collation}: Document) =>
{
  const pipeline: Document[] = [
    ...makeQueryPipeline({filter, sort, skip, limit}),
    {$count: 'count'}
  ];
  const c = engine.openCursor(collName, pipeline, collation);
  const {value} = await c.next();
  c.close();

  return {n: value.count, ok: 1};
}
