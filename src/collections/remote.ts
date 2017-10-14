import {provider} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, RemoteCollectionConfig, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';
import * as io from 'socket.io-client';

@provider({
  for: 'isimud.RemoteCollectionFactory',
  singleton: true
})
export class RemoteCollectionFactory implements CollectionFactory<RemoteCollectionConfig> {
  private socket: any;

  public constructor() {
    if (typeof window !== 'undefined' && window.document) {
      this.socket = io.connect(window.location.origin);
    }
  }

  public createCollection(name: string, config: RemoteCollectionConfig): Collection {
    return new RemoteCollection(config.path, name, this.socket);
  }
}

class RemoteCollection extends EventEmitter implements Collection {
  public constructor(
    private _path: string,
    private _name: string,
    socket: any
  ) {
    super();

    if (socket) {
      socket.on('document-upserted', (doc: any) => {
        if (doc._collection === this._name) {
          this.emit('document-upserted', doc);
        }
      });
      socket.on('document-removed', (doc: any) => {
        if (doc._collection === this._name) {
          this.emit('document-removed', doc);
        }
      });
    }
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    let xhttp = new XMLHttpRequest();
    return new Promise((resolve) => {
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          resolve(JSON.parse(xhttp.responseText));
        }
      };
      xhttp.open('GET', this.createQuery(selector, options), true);
      xhttp.send();
    });
  }

  public findOne(selector: Object): Promise<any> {
    return new Promise((resolve) => {
      this.find(selector).then((result: any[]) => {
        resolve(result[0]);
      });
    });
  }

  public upsert(obj: any): Promise<any> {
    return Promise.resolve(obj);
  }

  public count(selector?: Object): Promise<number> {
    let xhttp = new XMLHttpRequest();
    return new Promise<number>((resolve, reject) => {
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          let header = xhttp.getResponseHeader('X-total-count');
          if (header) {
            resolve(parseInt(header, 10));
          } else {
            reject(new Error('Failed to get "X-total-count" header'));
          }
        }
      };
      xhttp.open('HEAD', this.createQuery(selector), true);
      xhttp.send();
    });
  }

  public remove(): Promise<void> {
    return Promise.reject(new Error('remove() not implemented for remote collection'));
  }

  public name(): string {
    return this._path;
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
