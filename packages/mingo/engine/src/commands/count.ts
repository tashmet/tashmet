import { Document } from '../interfaces';
import { CursorCommandHandler } from './common';

export class CountCommandHandler extends CursorCommandHandler {
  public async execute({count: collName, query, sort, skip, limit, collation}: Document) {
    return {
      n: this.makeCursor(collName, {filter: query || {}, sort, skip, limit, collation}).count(),
      ok: 1,
    };
  }
}
