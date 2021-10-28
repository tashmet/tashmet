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
} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {Fetch, SerializeQuery} from './interfaces';
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
    const input = await QueryAggregator.fromPipeline(pipeline).execute(this);
    return aggregate<U>(pipeline, input, this.database);
  }

  public find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T> {
    const serializeQuery: SerializeQuery = (filter, options) => {
      const params = this.querySerializer.serialize({filter, ...options});
      return params !== '' ? this.path + '?' + params : this.path;
    }
    return new HttpCollectionCursor<T>(
      serializeQuery, this.fetch, this.headers, filter, options
    );
  }

  public async findOne(filter: Filter<T>): Promise<any> {
    const docs = await this.find(filter).limit(1).toArray();
    if (docs.length === 0) {
      return null;
    }
    return docs[0];
  }

  public async insertOne(doc: any): Promise<any> {
    return this.post(doc);
  }

  public async insertMany(docs: any[]): Promise<any[]> {
    const result: any[] = [];
    for (const doc of docs) {
      result.push(await this.insertOne(doc));
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
      return this.insertOne(doc);
    }
    return null;
  }

  public async deleteOne(filter: Filter<T>): Promise<any> {
    const doc = await this.findOne(filter);
    if (doc) {
      await this.deleteOneById(doc._id);
      return doc;
    }
    return null;
  }

  public async deleteMany(filter: Filter<T>): Promise<T[]> {
    const docs = await this.find(filter).toArray();
    for (const doc of docs) {
      await this.deleteOneById((doc as any)._id);
    }
    return docs;
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
