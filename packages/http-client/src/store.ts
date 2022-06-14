/*
import {
  Store,
  Filter,
  FindOptions,
  Document,
  ChangeSet,
} from '@tashmet/tashmet';
import {QuerySerializer} from '@tashmet/qs-builder';
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

  public async find(filter: Filter<TSchema>, options: FindOptions<TSchema> = {}): Promise<Document> {
    const resp = await this.query(filter, options);
    if (!resp.ok) {
      throw new Error('failed to contact server');
    }
    return {
      cursor: {
        firstBatch: await resp.json(),
        ns: this.ns,
      }
    }
  }

  public async count(filter: Filter<TSchema>, options: FindOptions<TSchema> = {}): Promise<Document> {
    const resp = await this.query(filter, options, true);
    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('failed to get "x-total-count" header');
    }
    return {n: parseInt(totalCount, 10), ok: 1};
  }

  private query(filter?: Filter<TSchema>, options?: FindOptions, head?: boolean): Promise<Response> {
    return this.restLayer.get(this.querySerializer.serialize({filter, ...options}), head);
  }
}
*/
