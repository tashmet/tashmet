import {Container} from '@ziggurat/tiamat';
import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {CollectionProducer} from '../interfaces';

export interface HttpCollectionConfig {
  path: string;

  queryParams?: (selector: object, options: QueryOptions) => {[name: string]: string};
}

export function http(config: HttpCollectionConfig): CollectionProducer {
  return (container: Container, name: string): Collection => {
    return new HttpCollection(name, config);
  };
}

export function queryParams(selector: object, options: QueryOptions): {[name: string]: string} {
  let params: {[name: string]: string} = {};
  if (Object.keys(selector).length > 0) {
    params['selector'] = JSON.stringify(selector);
  }
  if (Object.keys(options).length > 0) {
    params['options'] = JSON.stringify(options);
  }
  return params;
}

export class HttpCollection extends EventEmitter implements Collection {
  private countCache: {[selector: string]: number} = {};
  private queryParams = queryParams;

  public constructor(
    public readonly name: string,
    private config: HttpCollectionConfig,
  ) {
    super();

    if (config.queryParams) {
      this.queryParams = config.queryParams;
    }
  }

  public async find(selector?: object, options?: QueryOptions): Promise<any[]> {
    let resp = await fetch(this.serializeQuery(selector, options));
    if (!resp.ok) {
      throw new Error('Failed to contact server');
    }
    this.updateTotalCount(selector || {}, resp);
    return await resp.json();
  }

  public async findOne(selector: object): Promise<any> {
    let docs = await this.find(selector, {limit: 1});
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
    let resp = await fetch(path, {
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
    let totalCount = this.countCache[JSON.stringify(selector)];
    if (!totalCount) {
      let resp = await fetch(this.serializeQuery(selector), {method: 'HEAD'});
      totalCount = this.updateTotalCount(selector || {}, resp);
    }
    return totalCount;
  }

  public async remove(selector: object): Promise<any[]> {
    let docs = await this.find(selector);
    for (let doc of docs) {
      let resp = await fetch(this.config.path + '/' + doc._id, {
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

  private updateTotalCount(selector: object, resp: Response): number {
    let totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('Failed to get "x-total-count" header');
    }
    return this.countCache[JSON.stringify(selector)] = parseInt(totalCount, 10);
  }
}
