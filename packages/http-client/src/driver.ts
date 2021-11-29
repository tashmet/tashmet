import {
  CollectionDriver,
  Cursor,
  Filter,
  QueryOptions,
  Document,
  OptionalId,
} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpCollectionCursor} from './cursor';
import {HttpRestLayer} from './common';

export class HttpDriver<TSchema extends Document> implements CollectionDriver<TSchema> {
  public constructor(
    public readonly ns: { db: string; coll: string },
    public restLayer: HttpRestLayer,
    private querySerializer: QuerySerializer,
  ) {}

  public async insert(document: OptionalId<TSchema>) {
    const result = await this.restLayer.post(document);
    Object.assign(document, {_id: result.insertedId});
    return result;
  }

  public async delete(matched: TSchema[]) {
    for (const doc of matched) {
      await this.restLayer.delete(doc._id);
    }
  }

  public async replace(old: TSchema, replacement: TSchema) {
    await this.restLayer.put(Object.assign({_id: old._id}, replacement), old._id);
  }

  public async findOne(filter: Filter<TSchema>): Promise<TSchema | null> {
    return this.find(filter).limit(1).next();
  }

  public find(filter: Filter<TSchema>, options: QueryOptions<TSchema> = {}): Cursor<TSchema> {
    return new HttpCollectionCursor<TSchema>(
      this.restLayer, this.querySerializer, filter, options
    );
  }
}
