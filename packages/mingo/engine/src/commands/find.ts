import { Document } from '../interfaces';
import { CursorCommandHandler, makeQueryPipeline } from './common';
import { Aggregator } from 'mingo';

export class FindCommandHandler extends CursorCommandHandler {
  public async execute({find: collName, filter, sort, projection, skip, limit, collation, batchSize}: Document) {
    const operators = makeQueryPipeline({filter, sort, skip, limit, projection});
    const it = new Aggregator(operators , {...this.options, collation})
      .stream(this.store.documents(collName));

    return this.addCursor(collName, it, batchSize);
  }
}
