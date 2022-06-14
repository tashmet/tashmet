import { AggregationEngine, makeQueryPipeline } from '../aggregation';
import { Cursor, CursorRegistry } from '../cursor';
import { DatabaseEngine, Document } from '../interfaces';
import { AbstractQueryEngine } from '../query';

async function makeCursorResponse(
  c: Cursor, ns: {db: string, coll: string}, batchSize: number | undefined, firstBatch: boolean = true
) {
  return {
    cursor: {
      [firstBatch ? 'firstBatch' : 'nextBatch']: await c.getBatch(batchSize) ,
      id: c.id,
      ns,
    },
    ok: 1,
  }
}

export function makeAggregateCommand(aggregator: AggregationEngine) {
  return async ({aggregate: coll, pipeline, cursor, collation}: Document, db: DatabaseEngine) => {
    const c = aggregator.aggregate(coll, pipeline, collation);
    return makeCursorResponse(c, {db: db.databaseName, coll}, cursor ? cursor.batchSize : undefined);
  }
}

export function makeFindCommand(query: AbstractQueryEngine) {
  return async ({find: coll, filter, sort, projection, skip, limit, collation, batchSize}: Document, db: DatabaseEngine) => {
    const c = query.find(coll, {filter, sort, projection, skip, limit}, collation);
    return makeCursorResponse(c, {db: db.databaseName, coll}, batchSize);
  }
}

export function makeGetMoreCommand(cursors: CursorRegistry) {
  return async ({getMore, collection, batchSize}: Document, db: DatabaseEngine) => {
    const c = cursors.getCursor(getMore);
    if (!c) throw new Error('Invalid cursor');
    return makeCursorResponse(c, {db: db.databaseName, coll: collection}, batchSize, false);
  }
}

export function makeCountCommand(engine: AbstractQueryEngine | AggregationEngine) {
  return async ({count: collName, query: filter, sort, skip, limit, collation}: Document) => {
    if (engine instanceof AggregationEngine) {
      const pipeline: Document[] = [
        ...makeQueryPipeline({filter, sort, skip, limit}),
        {$count: 'count'}
      ];
      const c = engine.aggregate(collName, pipeline, collation);
      const {value} = await c.next();
      engine.closeCursor(c);

      return {n: value.count, ok: 1};
    } else {
      const c = engine.find(collName, {filter, sort, skip, limit}, collation);
      const n = (await c.toArray()).length;
      engine.closeCursor(c);

      return {n, ok: 1};
    }
  }
}
