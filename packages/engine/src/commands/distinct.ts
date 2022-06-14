import { AggregationEngine } from '../aggregation';
import { Document } from '../interfaces';

export function makeDistinctCommand(aggregator: AggregationEngine) {
  return async ({distinct: collName, key, query, collation}: Document) => {
    const pipeline: Document[] = [
      {$match: query || {}},
      {$unwind: `$${key}`},
      {$group: {_id: `$${key}`}},
    ]; 

    const c = aggregator.aggregate(collName, pipeline, collation);
    const values = (await c.toArray()).map(doc => doc._id);
    aggregator.closeCursor(c);

    return {values, ok: 1};
  }
}
