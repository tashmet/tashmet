import { Document, DatabaseCommandHandler } from '../interfaces';

export const $drop: DatabaseCommandHandler
  = async (engine, {create: coll}: Document) =>
{
  await engine.store.drop(coll);
  return {ok: 1};
}
