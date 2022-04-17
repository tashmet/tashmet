import { Document } from '../interfaces';
import { CursorCommandHandler } from './common';

export class GetMoreCommandHandler extends CursorCommandHandler {
  public async execute({getMore, collection, batchSize}: Document) {
    const cursor = this.cursors.get(getMore);
    if (!cursor) throw new Error('Invalid cursor');
    return {
      cursor: {
        nextBatch: this.getBatch(cursor, batchSize),
        id: getMore,
        ns: {db: this.store.databaseName, coll: collection},
      },
      ok: 1,
    }
  }
}
