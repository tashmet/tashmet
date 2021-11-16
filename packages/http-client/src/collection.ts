import {
  aggregate,
  Cursor,
  Filter,
  QueryOptions,
  ReplaceOneOptions,
  AggregationPipeline,
  Database,
  QueryAggregator,
  Collection,
  InsertOneResult,
  InsertManyResult,
  DeleteResult,
} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {Fetch} from './interfaces';
import {HttpCollectionCursor} from './cursor';

export class HttpCollection<T> extends Collection<T> {
  public constructor(
    public readonly name: string,
    private database: Database,
    private path: string,
    private querySerializer: QuerySerializer,
    private fetch: Fetch,
    private headers: Record<string, string> = {},
  ) {
    super();
  }

  public toString(): string {
    return `http collection '${this.name}' at '${this.path}'`;
  }

  public async aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    try {
      return QueryAggregator.fromPipeline(pipeline, true).execute(this);
    } catch (error) {
      const input = await QueryAggregator.fromPipeline(pipeline).execute(this);
      return aggregate<U>(pipeline, input, this.database);
    }
  }

  public find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T> {
    return new HttpCollectionCursor<T>(
      this.path, this.querySerializer, this.fetch, this.headers, filter, options
    );
  }

  public async findOne(filter: Filter<T>): Promise<any> {
    const docs = await this.find(filter).limit(1).toArray();
    if (docs.length === 0) {
      return null;
    }
    return docs[0];
  }

  public async insertOne(doc: any): Promise<InsertOneResult> {
    const result = await this.post(doc);
    doc._id = result.insertedId;
    return result;
  }

  public async insertMany(docs: any[]): Promise<InsertManyResult> {
    let result: InsertManyResult = {
      insertedCount: 0,
      insertedIds: {},
      acknowledged: true
    };
    for (let i=0; i<docs.length; i++) {
      const resultOne = await this.insertOne(docs[i]);
      result.insertedCount += 1;
      result.insertedIds[i] = resultOne.insertedId;
    }
    return result;
  }

  public async replaceOne(
    filter: Filter<T>, doc: any, options: ReplaceOneOptions = {}): Promise<T | null>
  {
    const old = await this.findOne(filter);
    if (old) {
      return this.put(Object.assign({_id: old._id}, doc), old._id);
    } else if (options.upsert) {
      const result = await this.insertOne(doc);
      return Object.assign(doc, {_id: result.insertedId});
    }
    return null;
  }

  public async deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    const doc = await this.findOne(filter);
    if (doc) {
      await this.deleteOneById(doc._id);
    }
    return {acknowledged: true, deletedCount: doc ? 1 : 0};
  }

  public async deleteMany(filter: Filter<T>): Promise<DeleteResult> {
    const docs = await this.find(filter).toArray();
    for (const doc of docs) {
      await this.deleteOneById((doc as any)._id);
    }
    return {acknowledged: true, deletedCount: docs.length};
  }

  private async deleteOneById(id: string): Promise<void> {
    const resp = await this.fetch(this.path + '/' + id, {
      method: 'DELETE',
      headers: this.makeHeaders(),
    });
    if (!resp.ok) {
      throw new Error(await this.errorMessage(resp));
    }
  }

  private async put(doc: any, id: string) {
    return this.send('PUT', `${this.path}/${id}`, doc);
  }

  private async post(doc: any) {
    return this.send('POST', this.path, doc);
  }

  private async send(method: 'POST' | 'PUT', path: string, doc: any) {
    const resp = await this.fetch(path, {
      body: JSON.stringify(doc),
      method,
      headers: this.makeHeaders({
        'content-type': 'application/json'
      }),
    });
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error(await this.errorMessage(resp));
    }
  }

  private makeHeaders(headers?: Record<string, string>) {
    return Object.assign({}, headers, this.headers);
  }

  private async errorMessage(resp: Response): Promise<string> {
    try {
      return (await resp.json()).message;
    } catch (err) {
      try {
        return await resp.text();
      } catch (err) {
        return resp.statusText;
      }
    }
  }
}
