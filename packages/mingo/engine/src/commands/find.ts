import { DatabaseCommandHandler, Document } from '../interfaces';
import { makeQueryPipeline } from './common';

export const $find: DatabaseCommandHandler 
  = async (engine, {find: coll, filter, sort, projection, skip, limit, collation, batchSize}: Document) =>
{
  return engine.command({
    aggregate: coll,
    pipeline: makeQueryPipeline({filter, sort, skip, limit, projection}),
    cursor: {batchSize},
    collation
  });
}
