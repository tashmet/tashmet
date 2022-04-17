import { Document } from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { MingoCommandHandler } from '../command';

export class DistinctCommandHandler extends MingoCommandHandler {
  public execute({distinct: collName, key, query, collation}: Document) {
    const pipeline = [
      {$match: query || {}},
      {$unwind: `$${key}`},
      {$group: {_id: `$${key}`}},
    ]; 
    const values = new Aggregator(pipeline, {...this.options, collation})
      .run(this.store.collections[collName])
      .map(doc => doc._id);

    return {values, ok: 1};
  }
}
