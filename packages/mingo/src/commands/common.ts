import ObjectID from 'bson-objectid';
import { Query } from 'mingo';
import { Iterator } from 'mingo/lazy';
import { Document } from '@tashmet/tashmet';
import { MingoCommandHander } from '../command';

export abstract class CursorCommandHandler extends MingoCommandHander {
  protected makeCursor(collName: string, {filter, sort, skip, limit, projection, collation}: Document) {
    const cursor = new Query(filter, {...this.options, collation})
      .find(this.store.collections[collName], projection);

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor;
  }

  protected addCursor(collName: string, it: Iterator, batchSize: number | undefined = undefined): Document {
    const id = new ObjectID().toHexString();
    this.store.cursors[id] = it;
    return {
      cursor: {
        firstBatch: this.getBatch(it, batchSize),
        id,
        ns: {db: this.store.name, coll: collName},
      },
      ok: 1,
    }
  }

  protected getBatch(it: Iterator, batchSize: number | undefined = undefined): Document[] {
    let batch: Document[] = [];
    let result = it.next();
    while (!result.done && !batchSize || (batchSize && batch.length < batchSize)) {
      batch.push(result.value as Document);
      result = it.next();
    }
    return batch;
  }
}
