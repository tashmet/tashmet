import {
  Store,
  Cursor,
  Filter,
  FindOptions,
  Document,
  ChangeSet,
  QueryAggregator,
} from '@tashmet/database';
import {QuerySerializer} from '@tashmet/qs-builder';
import {HttpCollectionCursor} from './cursor';
import {HttpRestLayer} from './common';

export class HttpStore<TSchema extends Document> extends Store<TSchema> {
  public constructor(
    ns: { db: string; coll: string },
    public restLayer: HttpRestLayer,
    private querySerializer: QuerySerializer,
  ) { super(ns); }

  public async write(cs: ChangeSet<TSchema>) {
    for (const doc of cs.deletions) {
      await this.restLayer.delete(doc._id);
    }
    for (const doc of cs.insertions) {
      const result = await this.restLayer.post(doc);
      Object.assign(doc, {_id: result.insertedId});
      return result;
    }
    for (const doc of cs.replacements) {
      await this.restLayer.put(doc, doc._id);
    }
  }

  public find(filter: Filter<TSchema>, options: FindOptions<TSchema> = {}): Cursor<TSchema> {
    return new HttpCollectionCursor<TSchema>(
      this.restLayer, this.querySerializer, filter, options
    );
  }

  public aggregate<T>(pipeline: Document[]): Cursor<T> {
    try {
      return QueryAggregator.fromPipeline<T>(pipeline, true).execute(this) as any;
    } catch (error) {
      throw error;
    }
  }
}
