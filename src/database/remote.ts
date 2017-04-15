import {provider, inject, Injector} from '@samizdatjs/tiamat';
import {RemoteDatabase, Collection, QueryOptions} from '../interfaces';
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

  public createCollection(path: string): Collection {
    let collection = new RemoteCollection(path);
    this.collections[path] = collection;
    return collection;
  }
}

class RemoteCollection extends EventEmitter implements Collection {
  public constructor(
    private _path: string,
  ) {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    let query = this._path;
    if (selector) {
      query = query + '?selector=' + JSON.stringify(selector);
    }
    if (options) {
      query = query + '&options=' + JSON.stringify(options);
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

  public name(): string {
    return this._path;
  }
}
