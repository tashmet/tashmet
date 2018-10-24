import {Transformer} from '@ziggurat/amelatu';
import {Collection, QueryOptions} from '../interfaces';
import {CollectionConfig} from '../database/interfaces';
import {EventEmitter} from 'eventemitter3';

export class RemoteCollection extends EventEmitter implements Collection {
  private countCache: {[selector: string]: number} = {};

  public constructor(
    private _path: string,
    private config: CollectionConfig,
    private transformer: Transformer,
    socket: any
  ) {
    super();

    function belongs(doc: any): boolean {
      return doc._collection === config.name
        || '@id' in doc && doc['@id'].startsWith(config.name);
    }

    if (socket) {
      socket.on('document-upserted', (doc: any) => {
        if (belongs(doc)) {
          this.transformer.toInstance(doc, 'relay').then(instance =>
            this.emit('document-upserted', instance));
        }
      });
      socket.on('document-removed', (doc: any) => {
        if (belongs(doc)) {
          this.emit('document-removed', doc);
        }
      });
    }
  }

  public get name(): string {
    return this.config.name + '.source';
  }

  public async find<T>(selector?: object, options?: QueryOptions): Promise<T[]> {
    let resp = await fetch(this.createQuery(selector, options));
    if (!resp.ok) {
      throw new Error('Failed to contact server');
    }
    this.updateTotalCount(selector || {}, resp);
    let result = [];
    for (let obj of await resp.json()) {
      result.push(await this.transformer.toInstance<T>(obj, 'relay'));
    }
    return result;
  }

  public async findOne<T>(selector: object): Promise<T> {
    let docs = await this.find<T>(selector, {limit: 1});
    if (docs.length === 0) {
      throw new Error('Document not found');
    }
    return docs[0];
  }

  public async upsert<T>(doc: T): Promise<T> {
    let resp = await fetch(this._path, {
      body: JSON.stringify(await this.transformer.toPlain(doc, 'relay')),
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
      let resp = await fetch(this.createQuery(selector), {method: 'HEAD'});
      totalCount = this.updateTotalCount(selector || {}, resp);
    }
    return totalCount;
  }

  public remove<T>(selector?: object): Promise<T[]> {
    return Promise.reject(new Error('remove() not implemented for remote collection'));
  }

  private updateTotalCount(selector: object, resp: Response): number {
    let totalCount = resp.headers.get('x-total-count');
    if (!totalCount) {
      throw new Error('Failed to get "x-total-count" header');
    }
    return this.countCache[JSON.stringify(selector)] = parseInt(totalCount, 10);
  }

  private createQuery(selector?: Object, options?: QueryOptions): string {
    let query = this._path;
    let params: {[name: string]: string} = {};
    if (selector && Object.keys(selector).length > 0) {
      params['selector'] = JSON.stringify(selector);
    }
    if (options && Object.keys(options).length > 0) {
      params['options'] = JSON.stringify(options);
    }
    if (Object.keys(params).length > 0) {
      const esc = encodeURIComponent;
      query = query + '?' + Object.keys(params)
          .map(k => esc(k) + '=' + esc(params[k]))
          .join('&');
    }
    return query;
  }
}
