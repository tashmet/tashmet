import {Collection, QueryOptions} from '../interfaces';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {filter, find, findIndex, remove} from 'lodash';

export class MemoryCollection extends EventEmitter implements Collection {
  public docs: Document[] = [];

  public constructor() {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    return Promise.resolve(filter(this.docs, selector || {}));
  }

  public findOne(selector: Object): Promise<any> {
    let doc = find(this.docs, {_id: (<any>selector)._id});
    if (doc) {
      return Promise.resolve(doc);
    } else {
      return Promise.reject(new Error('Document not found'));
    }
  }

  public upsert(doc: any): Promise<any> {
    const i = findIndex(this.docs, function(o) { return o._id === doc._id; });
    if (i >= 0) {
      this.docs[i] = doc;
    } else {
      this.docs.push(doc);
    }
    this.emit('document-upserted', doc);
    return Promise.resolve(doc);
  }

  public remove(selector: any): Promise<void> {
    for (let doc of remove(this.docs, selector)) {
      this.emit('document-removed', doc);
    }
    return Promise.resolve();
  }

  public count(selector?: Object): Promise<number> {
    return Promise.resolve(this.docs.length);
  }

  public name(): string {
    return '';
  }
}
