import {provider, inject, Injector} from '@samizdatjs/tiamat';
import {RemoteDatabase, Collection, ServerConfig} from '../interfaces';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';

export function remote(path: string): any {
  return function(injector: Injector): Collection {
    let database = injector.get<RemoteDatabase>('tashmetu.RemoteDatabase');
    return database.createCollection(path);
  };
}

@provider({
  for: 'tashmetu.RemoteDatabase',
  singleton: true
})
export class RemoteDB implements RemoteDatabase {
  private collections: {[index: string]: Collection} = {};

  @inject('tashmetu.ServerConfig') private serverConfig: ServerConfig;

  public createCollection(path: string): Collection {
    let collection = new RemoteCollection(path, this.serverConfig);
    this.collections[path] = collection;
    return collection;
  }
}

class RemoteCollection extends EventEmitter implements Collection {
  public constructor(
    private _path: string,
    private serverConfig: ServerConfig
  ) {
    super();
  }

  public find(selector: Object, options: Object): Promise<any> {
    let query = this.serverConfig.url + this._path;
    if (selector) {
      query = query + '?selector=' + JSON.stringify(selector);
    }

    let xhttp = new XMLHttpRequest();
    return new Promise((resolve) => {
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          resolve(JSON.parse(xhttp.responseText));
        }
      };
      xhttp.open('GET', query, true);
      xhttp.send();
    });
  }

  public findOne(selector: Object, options: Object): Promise<any> {
    return new Promise((resolve) => {
      this.find(selector, options).then((result: any[]) => {
        resolve(result[0]);
      });
    });
  }

  public upsert(obj: any): Promise<any> {
    return Promise.resolve(obj);
  }

  public name(): string {
    return this._path;
  }
}
