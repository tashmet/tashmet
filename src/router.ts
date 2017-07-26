import {injectable, PropertyMeta} from '@ziggurat/tiamat';
import {RouteConfig} from './decorators';
import * as path2re from 'path-to-regexp';

@injectable()
export class Router<T> {
  private routes: PropertyMeta<RouteConfig>[];

  public constructor() {
    this.routes = Reflect.getMetadata('isimud:route', this.constructor) || [];
  }

  public get(path: string): Promise<T> {
    for (let i = 0; i < this.routes.length; i++) {
      let keys: any[] = [];
      let re = path2re(this.routes[i].data.path, keys);
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
