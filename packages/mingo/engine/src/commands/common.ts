import ObjectID from 'bson-objectid';
import { Query } from 'mingo';
import { Iterator } from 'mingo/lazy';
import { Options as MingoOptions } from 'mingo/core';
import { Document, StorageEngine } from '../interfaces';
import { MingoCommandHandler } from '../command';
import { MingoCursorRegistry } from '../storageEngine';

export abstract class CursorCommandHandler extends MingoCommandHandler {
  public constructor(
    protected cursors: MingoCursorRegistry,
    store: StorageEngine,
    options: MingoOptions = {}
  ) { super(store, options); }

  protected makeCursor(collName: string, {filter, sort, skip, limit, projection, collation}: Document) {
    const cursor = new Query(filter, {...this.options, collation})
      .find(this.store.documents(collName), projection);

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor;
  }

  protected addCursor(collName: string, it: Iterator, batchSize: number | undefined = undefined): Document {
    const id = new ObjectID().toHexString();
    this.cursors.set(id, it);
    return {
      cursor: {
        firstBatch: this.getBatch(it, batchSize),
        id,
        ns: {db: this.store.databaseName, coll: collName},
      },
      ok: 1,
    }
  }

  protected getBatch(it: Iterator, batchSize: number | undefined = undefined): Document[] {
    let batch: Document[] = [];
    let result = it.next();

    while (!result.done) {
      batch.push(result.value as Document);

      if (!batchSize || (batchSize && batch.length < batchSize)) {
        result = it.next();
      } else {
        break;
      }
    }
    return batch;
  }
}
