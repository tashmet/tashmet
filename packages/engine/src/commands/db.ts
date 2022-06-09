import ObjectId from 'bson-objectid';
import { AggregationEngine } from '../aggregation';
import { Document, StorageEngine, DatabaseEngine } from '../interfaces';

export function makeCreateCommand(storage: StorageEngine, aggregator?: AggregationEngine) {
  return async ({create: coll, viewOn, pipeline, ...options}: Document) => {
    if (viewOn) {
      if (aggregator) {
        await aggregator.createView(coll, {viewOn, pipeline});
      } else {
        throw new Error('views are not supported by the database engine');
      }
    } else {
      await storage.create(coll, options);
    }
    return {ok: 1};
  }
}

export function makeDropCommand(storage: StorageEngine) {
  return async ({drop: coll}: Document, db: DatabaseEngine) => {
    await storage.drop(coll);
    db.emit('change', {
      _id: new ObjectId(),
      operationType: 'drop',
      ns: {db: db.databaseName, coll},
    });
    return {ok: 1};
  }
}
