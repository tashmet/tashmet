import ObjectID from 'bson-objectid';
import * as Mingo from 'mingo';
import {Options as MingoInternalOptions, initOptions} from 'mingo/core';
import {Cursor as MingoInternalCursor} from 'mingo/cursor';
import {Query as MingoInternalQuery} from 'mingo/query';
import {
  ChangeSet,
  idSet,
  CollationOptions,
  Store,
  Cursor,
  Document,
  Filter,
  FindOptions,
  StoreConfig,
} from '@tashmet/tashmet';
import { MingoConfig } from './interfaces';
import { MingoCursor } from './cursor';


export class MingoStore<TSchema extends Document> extends Store<TSchema> {
  public documents: TSchema[] = [];
  private options: MingoInternalOptions;
  private cursors: Record<string, MingoInternalCursor> = {}

  public constructor(
    ns: { db: string; coll: string },
    options: MingoConfig & {collation?: CollationOptions} = {},
  ) {
    super(ns);
    this.options = initOptions(options);
  }

  public static fromConfig<TSchema>({ns, ...options}: StoreConfig & MingoConfig) {
    return new MingoStore<TSchema>(ns, options);
  }

  public indexOf(document: TSchema) {
    return this.documents.findIndex(o => o._id === document._id);
  }

  public async write(cs: ChangeSet<TSchema>) {
    for (const document of cs.insertions) {
      if (!document.hasOwnProperty('_id')) {
        (document as any)._id = new ObjectID().toHexString() as any;
      } else if (this.indexOf(document) >= 0) {
        throw new Error('Duplicate IDs');
      }
      this.documents.push(document);
    }

    for (const document of cs.replacements) {
      this.documents[this.indexOf(document as any)] = {_id: document._id, ...document};
    }

    const deletions = cs.deletions;
    if (deletions.length > 0) {
      const ids = idSet(deletions);
      this.documents = this.documents.filter(doc => !ids.has(doc._id));
    }
  }

  public async count(filter: Filter<TSchema> = {}, {sort, skip, limit, projection}: FindOptions<TSchema> = {}): Promise<Document> {
    const cursor = this.makeCursor(filter, {sort, skip, limit, projection});
    return {n: cursor.count(), ok: 1};
  }

  public async find(filter: Filter<TSchema> = {}, {sort, skip, limit, projection, batchSize}: FindOptions<TSchema> = {}): Promise<Document> {
    const cursor = this.makeCursor(filter, {sort, skip, limit, projection});

    let firstBatch: TSchema[] = [];
    if (batchSize) {
      while(cursor.hasNext() && firstBatch.length < batchSize) {
        firstBatch.push(cursor.next() as TSchema);
      }
    } else {
      firstBatch = cursor.all() as TSchema[];
    }

    const id = new ObjectID().toHexString();
    this.cursors[id] = cursor;

    return {
      cursor: {
        firstBatch,
        id,
        ns: this.ns,
      },
      ok: 1,
    }
  }

  private makeCursor(filter: Filter<TSchema> = {}, {sort, skip, limit, projection}: FindOptions<TSchema> = {}): MingoInternalCursor {
    const cursor = new Mingo.Query(filter, this.options)
      .find(this.documents, projection);

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor;
  }
}
