import { Aggregator } from 'mingo';
import { Document } from '../interfaces';
import { CursorCommandHandler, makeQueryPipeline } from './common';

export class CountCommandHandler extends CursorCommandHandler {
  public async execute({count: collName, query: filter, sort, skip, limit, collation}: Document) {
    const operators = [...makeQueryPipeline({filter, sort, skip, limit}), {$count: 'count'}];

    const {count} = new Aggregator(operators , {...this.options, collation})
      .run(this.store.documents(collName))[0]

    return {n: count, ok: 1};
  }
}
