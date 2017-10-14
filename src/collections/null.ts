import {Collection, QueryOptions} from '../interfaces';
import {EventEmitter} from 'eventemitter3';

export class NullCollection extends EventEmitter implements Collection {
  public constructor(private _name: string) {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    return Promise.resolve([]);
  }

  public findOne(selector: Object): Promise<any> {
    return Promise.reject(new Error('Failed to find document in collection'));
  }

  public upsert(obj: any): Promise<any> {
    return Promise.resolve(obj);
  }

  public remove(selector: Object): Promise<void> {
    return Promise.resolve();
  }

  public count(selector?: Object): Promise<number> {
    return Promise.resolve(0);
  }

  public name(): string {
    return this._name;
  }
}
