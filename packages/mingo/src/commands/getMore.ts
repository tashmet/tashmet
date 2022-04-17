import { Document } from '@tashmet/tashmet';
import { CursorCommandHandler } from './common';

export class GetMoreCommandHandler extends CursorCommandHandler {
  public execute({getMore, collection, batchSize}: Document) {
    const cursor = this.store.cursors[getMore];
    if (!cursor) throw new Error('Invalid cursor');
    return {
      cursor: {
        nextBatch: this.getBatch(cursor, batchSize),
        id: getMore,
        ns: {db: this.store.name, coll: collection},
      },
      ok: 1,
    }
  }
}
