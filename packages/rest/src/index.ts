import {
  aggregate,
  AbstractCursor,
  CollectionFactory,
  Cursor,
  QueryOptions,
  ReplaceOneOptions,
  AggregationPipeline,
  Database,
  Query,
  AutoEventCollection,
} from '@ziqquratu/database';

export type MakeQueryParams = (selector: object, options: QueryOptions) => {[name: string]: string};

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface RestCollectionConfig {
  path: string;

  queryParams?: MakeQueryParams;

  emitter?: any;

  fetch?: Fetch;
}

export const queryParams = (selector: object, options: QueryOptions): {[name: string]: string} => {
  const params: {[name: string]: string} = {};
  if (Object.keys(selector).length > 0) {
    params['selector'] = JSON.stringify(selector);
  }
  if (options.sort) {
    params['sort'] = JSON.stringify(options.sort);
  }
  if (options.skip) {
    params['skip'] = options.skip.toString();
  }
  if (options.limit) {
    params['limit'] = options.limit.toString();
  }
  return params;
}

export class RestCollectionCursor<T = any> extends AbstractCursor<T> {
  public constructor(
    private queryParams: MakeQueryParams,
    private path: string,
    private fetch: Fetch,
    selector: object = {},
    options: QueryOptions = {},
  ) {
    super(selector, options);
  }

  public async toArray(): Promise<T[]> {
    const resp = await this.fetch(this.serializeQuery(this.selector, this.options));
    if (!resp.ok) {
      throw new Error('failed to contact server');
    }
    return await resp.json();
  }

  public async count(applySkipLimit = true): Promise<number> {
    const resp = await this.fetch(
      this.serializeQuery(this.selector, applySkipLimit ? this.options : {}), {method: 'HEAD'}
    );

    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('failed to get "x-total-count" header');
    }
    return parseInt(totalCount, 10);
  }

  private serializeQuery(selector?: object, options?: QueryOptions): string {
    const params = this.queryParams(selector || {}, options || {});

    let query = this.path;
    if (Object.keys(params).length > 0) {
      const esc = encodeURIComponent;
      query = query + '?' + Object.keys(params)
          .map(k => esc(k) + '=' + esc(params[k]))
          .join('&');
    }
    return query;
  }
}

export class RestCollection extends AutoEventCollection {
  private queryParams = queryParams;
  private fetch: Fetch;

  public constructor(
    public readonly name: string,
    private config: RestCollectionConfig,
    private database: Database,
  ) {
    super();

    if (config.queryParams) {
      this.queryParams = config.queryParams;
    }
    this.fetch = config.fetch || window.fetch;
  }

  public toString(): string {
    return `http collection '${this.name}' at '${this.config.path}'`;
  }

  public async aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    const query = Query.fromPipeline(pipeline);
    const input = await this.find(query.match.value, query).toArray();
    return aggregate(pipeline, input, this.database);
  }

  public find(selector?: object, options?: QueryOptions): Cursor<any> {
    return new RestCollectionCursor(this.queryParams, this.config.path, this.fetch, selector, options);
  }

  public async findOne(selector: object): Promise<any> {
    const docs = await this.find(selector).limit(1).toArray();
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

  public async replaceOne(selector: object, doc: any, options: ReplaceOneOptions = {}): Promise<any> {
    const old = await this.findOne(selector);
    if (old) {
      return this.put(Object.assign({_id: old._id}, doc), old._id);
    } else if (options.upsert) {
      return this.insertOne(doc);
    }
    return null;
  }

  public async deleteOne(selector: object): Promise<any> {
    const doc = await this.findOne(selector);
    if (doc) {
      await this.deleteOneById(doc._id);
      return doc;
    }
    return null;
  }

  public async deleteMany(selector: object): Promise<any[]> {
    const docs = await this.find(selector).toArray();
    for (const doc of docs) {
      await this.deleteOneById(doc._id);
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

export const rest = (config: RestCollectionConfig) => new RestCollectionFactory(config);
