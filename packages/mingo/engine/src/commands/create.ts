import { Document, DatabaseCommandHandler } from '../interfaces';

export const $create: DatabaseCommandHandler
  = async (engine, {create: coll, viewOn, pipeline}: Document) =>
{
  await engine.store.create(coll);
  return {ok: 1};
}
