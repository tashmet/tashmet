import {RemoteDatabase, Collection} from '../interfaces';
import {service} from '@samizdatjs/tiamat';
import {EventEmitter} from '../util';
import * as loki from 'lokijs';

@service({
  name: 'tashmetu.RemoteDatabase',
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

  public find(filter: Object, options: Object, fn: (result: any) => void): void {
    this.get(fn);
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    fn({});
  }

  public upsert(obj: any, fn: () => void): void {
    fn();
  }

  public name(): string {
    return this._name;
  }

  private get(fn: Function): void {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        fn(JSON.parse(xhttp.responseText));
      }
    };
    xhttp.open('GET', 'http://localhost:3001/api/' + this._name, true);
    xhttp.send();
  }
}
