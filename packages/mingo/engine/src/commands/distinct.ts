import { Document } from '../interfaces';
import { Aggregator } from 'mingo';
import { MingoCommandHandler } from '../command';

export class DistinctCommandHandler extends MingoCommandHandler {
  public async execute({distinct: collName, key, query, collation}: Document) {
    const pipeline = [
      {$match: query || {}},
      {$unwind: `$${key}`},
      {$group: {_id: `$${key}`}},
    ]; 
    const values = new Aggregator(pipeline, {...this.options, collation})
      .run(this.store.documents(collName))
      .map(doc => doc._id);

    return {values, ok: 1};
  }
}
