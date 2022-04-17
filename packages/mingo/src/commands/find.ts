import { Document } from '@tashmet/tashmet';
import { Iterator } from 'mingo/lazy';
import { CursorCommandHandler } from './common';

export class FindCommandHandler extends CursorCommandHandler {
  public execute({find: collName, filter, sort, projection, skip, limit, collation, batchSize}: Document) {
    const cursor = this.makeCursor(collName, {filter: filter || {}, sort, skip, limit, projection, collation});
    return this.addCursor(collName, new Iterator(cursor.all()), batchSize);
  }
}
