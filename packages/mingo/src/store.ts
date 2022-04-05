import ObjectID from 'bson-objectid';
import {Options as MingoInternalOptions, initOptions} from 'mingo/core';
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

  public find(filter: Filter<TSchema> = {}, options: FindOptions<TSchema> = {}): Cursor<TSchema> {
    return new MingoCursor<TSchema>(this.documents, filter, {...this.options, ...options});
  }
}
