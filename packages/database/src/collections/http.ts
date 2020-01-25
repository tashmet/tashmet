import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {CollectionFactory} from '../interfaces';

const io = require('socket.io-client');

export interface HttpCollectionConfig {
  path: string;

  queryParams?: (selector: object, options: QueryOptions) => {[name: string]: string};
}

export function queryParams(selector: object, options: QueryOptions): {[name: string]: string} {
  const params: {[name: string]: string} = {};
  if (Object.keys(selector).length > 0) {
    params['selector'] = JSON.stringify(selector);
  }
  if (Object.keys(options).length > 0) {
    params['options'] = JSON.stringify(options);
  }
  return params;
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

  public async find(selector?: object, options?: QueryOptions): Promise<any[]> {
    const resp = await fetch(this.serializeQuery(selector, options));
    if (!resp.ok) {
      throw new Error('Failed to contact server');
    }
    return await resp.json();
  }

  public async findOne(selector: object): Promise<any> {
    const docs = await this.find(selector, {limit: 1});
    if (docs.length === 0) {
      throw new Error('Document not found');
    }
    return docs[0];
  }

  public async upsert(doc: any): Promise<any> {
    const exists = (await this.count({_id: doc._id})) === 1;
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

  public async count(selector?: object): Promise<number> {
    const resp = await fetch(this.serializeQuery(selector), {method: 'HEAD'});

    const totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('Failed to get "x-total-count" header');
    }
    return parseInt(totalCount, 10);
  }

  public async remove(selector: object): Promise<any[]> {
    const docs = await this.find(selector);
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

  private serializeQuery(selector?: object, options?: QueryOptions): string {
    const params = this.queryParams(selector || {}, options || {});

    let query = this.config.path;
    if (Object.keys(params).length > 0) {
      const esc = encodeURIComponent;
      query = query + '?' + Object.keys(params)
          .map(k => esc(k) + '=' + esc(params[k]))
          .join('&');
    }
    return query;
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
