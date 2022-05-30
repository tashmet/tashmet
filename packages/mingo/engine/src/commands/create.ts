import { Document, DatabaseCommandHandler } from '../interfaces';

export const $create: DatabaseCommandHandler
  = async (engine, {create: coll, viewOn, pipeline}: Document) =>
{
  if (viewOn) {
    await engine.createView(coll, {viewOn, pipeline});
    console.log('created view');
  } else {
    await engine.store.create(coll);
  }

  return {ok: 1};
}
