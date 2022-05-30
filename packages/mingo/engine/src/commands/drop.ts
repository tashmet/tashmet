import ObjectId from 'bson-objectid';
import { Document, DatabaseCommandHandler } from '../interfaces';

export const $drop: DatabaseCommandHandler
  = async (engine, {drop: coll}: Document) =>
{
  await engine.store.drop(coll);
  engine.emit('change', {
    _id: new ObjectId(),
    operationType: 'drop',
    ns: {db: engine.store.databaseName, coll},
  });
  return {ok: 1};
}
