import * as Mingo from 'mingo';
import {Document} from '@tashmet/tashmet';
import {MingoCommandHander} from '../command';

export abstract class CursorCommandHandler extends MingoCommandHander {
  protected makeCursor(collName: string, {filter, sort, skip, limit, projection, collation}: Document) {
    const cursor = new Mingo.Query(filter, {...this.options, collation})
      .find(this.store.collections[collName], projection);

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor;
  }
}
