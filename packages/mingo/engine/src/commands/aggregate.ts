import { Aggregator } from 'mingo';
import { Document } from '../interfaces';
import { CursorCommandHandler } from './common';

export class AggregateCommandHandler extends CursorCommandHandler {
  public async execute({aggregate: collName, pipeline, cursor, collation}: Document) {
    const it = new Aggregator(pipeline, {...this.options, collation})
      .stream(this.store.documents(collName));

    return this.addCursor(collName, it, cursor ? cursor.batchSize : undefined);
  }
}
