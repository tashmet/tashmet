import {Transformer} from '@ziggurat/common';
import {Container} from '@ziggurat/tiamat';
import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import {CollectionConfig, SourceProducer} from '../database/interfaces';

export interface HttpCollectionConfig {
  path: string;

  socket?: any;

  queryParams?: (selector: object, options: QueryOptions) => {[name: string]: string};
}

export function http(config: HttpCollectionConfig): SourceProducer {
  return (container: Container, colConfig: CollectionConfig): Collection => {
    const transformer = container.get<Transformer>('ziggurat.Transformer');
    return new HttpCollection(colConfig.name, config, transformer);
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
    private _name: string,
    private config: HttpCollectionConfig,
    private transformer: Transformer,
  ) {
    super();

    if (config.queryParams) {
      this.queryParams = config.queryParams;
    }

    function belongs(doc: any): boolean {
      return doc._collection === _name
        || '@id' in doc && doc['@id'].startsWith(_name);
    }

    if (config.socket) {
      config.socket.on('document-upserted', (doc: any) => {
        if (belongs(doc)) {
          this.transformer.toInstance(doc, 'publishing').then(instance =>
            this.emit('document-upserted', instance));
        }
      });
      config.socket.on('document-removed', (doc: any) => {
        if (belongs(doc)) {
          this.emit('document-removed', doc);
        }
      });
    }
  }

  public get name(): string {
    return this._name + '.source';
  }

  public async find(selector?: object, options?: QueryOptions): Promise<any[]> {
    let resp = await fetch(this.serializeQuery(selector, options));
    if (!resp.ok) {
      throw new Error('Failed to contact server');
    }
    this.updateTotalCount(selector || {}, resp);
    let result = [];
    for (let obj of await resp.json()) {
      result.push(await this.transformer.toInstance(obj, 'publishing'));
    }
    return result;
  }

  public async findOne(selector: object): Promise<any> {
    let docs = await this.find(selector, {limit: 1});
    if (docs.length === 0) {
      throw new Error('Document not found');
    }
    return docs[0];
  }

  public async upsert(doc: any): Promise<any> {
    let resp = await fetch(this.config.path, {
      body: JSON.stringify(await this.transformer.toPlain(doc, 'publishing')),
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST'
    });
    if (resp.ok) {
      return doc;
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

  public remove(selector?: object): Promise<any[]> {
    return Promise.reject(new Error('remove() not implemented for remote collection'));
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
