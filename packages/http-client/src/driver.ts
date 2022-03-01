import {
  CollectionDriver,
  Cursor,
  Filter,
  QueryOptions,
  Document,
  ChangeSet,
} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpCollectionCursor} from './cursor';
import {HttpRestLayer} from './common';

export class HttpDriver<TSchema extends Document> extends CollectionDriver<TSchema> {
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

  public async findOne(filter: Filter<TSchema>): Promise<TSchema | null> {
    return this.find(filter).limit(1).next();
  }

  public find(filter: Filter<TSchema>, options: QueryOptions<TSchema> = {}): Cursor<TSchema> {
    return new HttpCollectionCursor<TSchema>(
      this.restLayer, this.querySerializer, filter, options
    );
  }

  public aggregate<T>(pipeline: Document[]): Cursor<T> {
    throw Error('Not implemented yet');
    /*
    try {
      return QueryAggregator.fromPipeline<T>(pipeline, true).execute(this) as any;
    } catch (error) {
      const input = await QueryAggregator.fromPipeline<T>(pipeline).execute(this);
      return aggregate<U>(pipeline, input, this.database);
    }
    */
  }
}
