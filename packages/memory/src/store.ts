import ObjectID from 'bson-objectid';
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
} from '@tashmet/database';
import { MemoryCursor } from './cursor';


export class MemoryStore<TSchema extends Document> extends Store<TSchema> {
  public documents: TSchema[] = [];

  public constructor(
    ns: { db: string; coll: string },
    private collation: CollationOptions | undefined = undefined,
  ) { super(ns); }

  public static fromConfig<TSchema>({ns, collation}: StoreConfig) {
    return new MemoryStore<TSchema>(ns, collation);
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
    return new MemoryCursor<TSchema>(this.documents, filter, {collation: this.collation, ...options});
  }
}
