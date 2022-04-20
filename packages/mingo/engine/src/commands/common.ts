import ObjectID from 'bson-objectid';
import { Iterator } from 'mingo/lazy';
import { Options as MingoOptions } from 'mingo/core';
import { Document, StorageEngine } from '../interfaces';
import { MingoCommandHandler } from '../command';
import { MingoCursorRegistry } from '../storageEngine';


export const makeQueryPipeline = ({filter, sort, skip, limit, projection}: Document) => {
  const operators: Document[] = [];

  if (filter) operators.push({$match: filter});
  if (sort) operators.push({$sort: sort});
  if (skip) operators.push({$skip: skip});
  if (limit) operators.push({$limit: limit});
  if (projection) operators.push({$project: projection});

  return operators;
}

export abstract class CursorCommandHandler extends MingoCommandHandler {
  public constructor(
    protected cursors: MingoCursorRegistry,
    store: StorageEngine,
    options: MingoOptions = {}
  ) { super(store, options); }

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
