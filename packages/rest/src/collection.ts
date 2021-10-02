import {
  aggregate,
  CollectionFactory,
  Cursor,
  Filter,
  QueryOptions,
  ReplaceOneOptions,
  AggregationPipeline,
  Database,
  QueryAggregator,
  AutoEventCollection,
} from '@ziqquratu/database';

import {Fetch, RestCollectionConfig} from './interfaces';
import {RestCollectionCursor} from './cursor';
import {HttpQueryBuilder} from './query';
import {jsonQuery} from './query/json';


export class RestCollection<T> extends AutoEventCollection<T> {
  private queryBuilder: HttpQueryBuilder;
  private fetch: Fetch;

  public constructor(
    public readonly name: string,
    private config: RestCollectionConfig,
    private database: Database,
  ) {
    super(config.emitter !== undefined);

    const qs = config.queryString || jsonQuery();

    this.queryBuilder = qs(config.path);
    if (config.emitter) {
      const emitter = config.emitter(this, config.path);
      emitter.on('change', change => this.emit('change', change));
      emitter.on('error', error => this.emit('error', error));
    }
    this.fetch = config.fetch || window.fetch;
  }

  public toString(): string {
    return `http collection '${this.name}' at '${this.config.path}'`;
  }

  public async aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    const input = await QueryAggregator.fromPipeline(pipeline).execute(this);
    return aggregate<U>(pipeline, input, this.database);
  }

  public find(filter?: Filter<T>, options?: QueryOptions<T>): Cursor<T> {
    return new RestCollectionCursor<T>(this.queryBuilder, this.fetch, filter, options);
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
    const resp = await this.fetch(this.config.path + '/' + id, {
      method: 'DELETE'
    });
    if (!resp.ok) {
      throw new Error(await this.errorMessage(resp));
    }
  }

  private async put(doc: any, id: string) {
    return this.send('PUT', `${this.config.path}/${id}`, doc);
  }

  private async post(doc: any) {
    return this.send('POST', this.config.path, doc);
  }

  private async send(method: 'POST' | 'PUT', path: string, doc: any) {
    const resp = await this.fetch(path, {
      body: JSON.stringify(doc),
      method,
      headers: {
        'content-type': 'application/json'
      },
    });
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error(await this.errorMessage(resp));
    }
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

export class RestCollectionFactory extends CollectionFactory {
  public constructor(private config: RestCollectionConfig) {
    super();
  }

  public async create(name: string, database: Database) {
    return new RestCollection(name, this.config, database);
  }
}
