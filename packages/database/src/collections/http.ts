import {Collection, CollectionFactory, Cursor, QueryOptions} from '../interfaces';
import {AbstractCursor} from '../cursor';
import {EventEmitter} from 'eventemitter3';

const io = require('socket.io-client');

export type MakeQueryParams = (selector: object, options: QueryOptions) => {[name: string]: string};

export interface HttpCollectionConfig {
  path: string;

  queryParams?: MakeQueryParams;
}

export const queryParams = (selector: object, options: QueryOptions): {[name: string]: string} => {
  const params: {[name: string]: string} = {};
  if (Object.keys(selector).length > 0) {
    params['selector'] = JSON.stringify(selector);
  }
  if (Object.keys(options).length > 0) {
    params['options'] = JSON.stringify(options);
  }
  return params;
}

export class HttpCollectionCursor<T = any> extends AbstractCursor<T> {
  public constructor(
    private queryParams: MakeQueryParams,
    private path: string,
    selector: object = {},
  ) {
    super(selector);
  }

  public async toArray(): Promise<T[]> {
    const resp = await fetch(this.serializeQuery(this.selector, this.options));
    if (!resp.ok) {
      throw new Error('Failed to contact server');
    }
    return await resp.json();
  }

  public async count(applySkipLimit = true): Promise<number> {
    const resp = await fetch(
      this.serializeQuery(this.selector, applySkipLimit ? this.options : {}), {method: 'HEAD'}
    );

    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('Failed to get "x-total-count" header');
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

export class HttpCollection extends EventEmitter implements Collection {
  private queryParams = queryParams;

  public constructor(
    public readonly name: string,
    private config: HttpCollectionConfig,
  ) {
    super();

    const socket = io.connect(config.path);
    socket.on('document-upserted', (doc: any) => {
      this.emit('document-upserted', doc);
    });
    socket.on('document-removed', (doc: any) => {
      this.emit('document-removed', doc);
    });

    if (config.queryParams) {
      this.queryParams = config.queryParams;
    }
  }

  public toString(): string {
    return `http collection '${this.name}' at '${this.config.path}'`;
  }

  public find(selector?: object): Cursor<any> {
    return new HttpCollectionCursor(this.queryParams, this.config.path, selector);
  }

  public async findOne(selector: object): Promise<any> {
    const docs = await this.find(selector).limit(1).toArray();
    if (docs.length === 0) {
      throw new Error('Document not found');
    }
    return docs[0];
  }

  public async upsert(doc: any): Promise<any> {
    const exists = (await this.find({_id: doc._id}).count()) === 1;
    let path = this.config.path;
    if (exists) {
      path = path + '/' + doc._id;
    }
    const resp = await fetch(path, {
      body: JSON.stringify(doc),
      headers: {
        'content-type': 'application/json'
      },
      method: exists ? 'PUT' : 'POST'
    });
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error('Failed to upsert');
    }
  }

  public async delete(selector: object): Promise<any[]> {
    const docs = await this.find(selector).toArray();
    for (const doc of docs) {
      const resp = await fetch(this.config.path + '/' + doc._id, {
        method: 'DELETE'
      });
      if (!resp.ok) {
        throw new Error('Failed to delete: ' + doc._id);
      }
    }
    return docs;
  }
}

export class HttpCollectionFactory extends CollectionFactory {
  public constructor(private config: HttpCollectionConfig) {
    super();
  }

  public create(name: string) {
    return new HttpCollection(name, this.config);
  }
}

export const http = (config: HttpCollectionConfig) => new HttpCollectionFactory(config);
