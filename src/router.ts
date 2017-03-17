import {injectable} from '@samizdatjs/tiamat';
import * as path2re from 'path-to-regexp';

@injectable()
export class Router<T> {
  private routes: any[];

  public constructor() {
    this.routes = Reflect.getMetadata('tashmetu:route', this.constructor) || [];
  }

  public get(path: string): Promise<T> {
    for (let i = 0; i < this.routes.length; i++) {
      let keys: any[] = [];
      let re = path2re(this.routes[i].config.path, keys);
      let match = re.exec(path);
      if (match) {
        let params: any = {};
        for (let j = 1; j < match.length; j++) {
          let key = keys[j - 1];
          let prop = key.name;
          let val = match[j];

          if (val !== undefined) {
            params[prop] = val;
          }
        }
        return (<any>this)[this.routes[i].key].call(this, params);
      }
    }
    return Promise.reject({});
  }
}
