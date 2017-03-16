import {RemoteDatabase, Collection} from '../interfaces';
import {provider} from '@samizdatjs/tiamat';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';

@provider({
  for: 'tashmetu.RemoteDatabase',
  singleton: true
})
export class RemoteDB implements RemoteDatabase {
  private collections: {[index: string]: Collection} = {};

  public createCollection(name: string): Collection {
    let collection = new RemoteCollection(name);
    this.collections[name] = collection;
    return collection;
  }
}

class RemoteCollection extends EventEmitter implements Collection {
  public constructor(private _name: string) {
    super();
  }

  public find(selector: Object, options: Object): Promise<any> {
    let query = 'http://localhost:3001/api/' + this._name;
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
    return this._name;
  }
}
