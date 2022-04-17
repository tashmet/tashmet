import { Document } from '@tashmet/tashmet';
import { CursorCommandHandler } from './common';

export class CountCommandHandler extends CursorCommandHandler {
  public execute({count: collName, query, sort, skip, limit, collation}: Document) {
    return {
      n: this.makeCursor(collName, {filter: query || {}, sort, skip, limit, collation}).count(),
      ok: 1,
    };
  }
}
