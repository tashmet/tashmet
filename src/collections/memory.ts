import {Collection, QueryOptions} from '../interfaces';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {filter, find, findIndex, remove} from 'lodash';

export class MemoryCollection extends EventEmitter implements Collection {
  public docs: Document[] = [];

  public constructor() {
    super();
  }

  public find<T extends Document>(selector?: object, options?: QueryOptions): Promise<any> {
    return Promise.resolve(filter(this.docs, selector || {}));
  }

  public async findOne<T extends Document>(selector: object): Promise<T> {
    let docs = await this.find<T>(selector);
    if (docs.length > 0) {
      return Promise.resolve(docs[0]);
    } else {
      return Promise.reject(new Error('Document not found'));
    }
  }

  public upsert<T extends Document>(doc: T): Promise<T> {
    const i = findIndex(this.docs, o => o._id === doc._id);
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

  public async count(selector?: object): Promise<number> {
    return (await this.find(selector)).length;
  }

  public name(): string {
    return '';
  }
}
