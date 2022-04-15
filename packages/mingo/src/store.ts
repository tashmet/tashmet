import ObjectID from 'bson-objectid';
import * as Mingo from 'mingo';
import {Options as MingoInternalOptions, initOptions} from 'mingo/core';
import {Aggregator as MingoInternalAggregator} from 'mingo/aggregator';
import {Iterator} from 'mingo/lazy';
import {
  ChangeSet,
  idSet,
  CollationOptions,
  Store,
  Document,
  Filter,
  FindOptions,
  StoreConfig,
} from '@tashmet/tashmet';
import { MingoConfig } from './interfaces';


export class MingoStore<TSchema extends Document> extends Store<TSchema> {
  public documents: TSchema[] = [];
  private options: MingoInternalOptions;
  private cursors: Record<string, Iterator> = {}

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

  public async count({query, sort, skip, limit}: Document): Promise<Document> {
    const cursor = this.makeCursor(query, {sort, skip, limit});
    return {n: cursor.count(), ok: 1};
  }

  public async find({filter ,sort, skip, limit, projection}: Document): Promise<Document> {
    return this.addCursor(new Iterator(this.makeCursor(filter, {sort, skip, limit, projection}).all()));
  }

  public async aggregate({pipeline, batchSize}: Document): Promise<Document> {
    const aggregator = new MingoInternalAggregator(pipeline, this.options);
    return this.addCursor(aggregator.stream(this.documents), batchSize)
  }

  public async getMore({getMore, batchSize}: Document): Promise<Document> {
    const cursor = this.cursors[getMore];
    if (!cursor) throw new Error('Invalid cursor');
    return {
      cursor: {
        nextBatch: this.getBatch(cursor, batchSize),
        id: getMore,
        ns: this.ns,
      },
      ok: 1,
    }
  }

  private getBatch(cursor: Iterator, batchSize: number | undefined = undefined): TSchema[] {
    let batch: TSchema[] = [];
    let result = cursor.next();
    while (!result.done && !batchSize || (batchSize && batch.length < batchSize)) {
      batch.push(result.value as TSchema);
      result = cursor.next();
    }
    return batch;
  }

  private async addCursor(it: Iterator, batchSize: number | undefined = undefined): Promise<Document> {
    const id = new ObjectID().toHexString();
    this.cursors[id] = it;
    return {
      cursor: {
        firstBatch: this.getBatch(it, batchSize),
        id,
        ns: this.ns,
      },
      ok: 1,
    }
  }

  private makeCursor(filter: Filter<TSchema> = {}, {sort, skip, limit, projection}: FindOptions<TSchema> = {}) {
    const cursor = new Mingo.Query(filter, this.options)
      .find(this.documents, projection)

    if (sort) cursor.sort(sort);
    if (skip !== undefined) cursor.skip(skip);
    if (limit !== undefined) cursor.limit(limit);

    return cursor;
  }
}
