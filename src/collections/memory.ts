import {provider, Container} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, CollectionType,
  QueryOptions} from '../interfaces';
import {CollectionConfig, SourceProducer} from '../database/interfaces';
import {EventEmitter} from 'eventemitter3';
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import findIndex from 'lodash/findIndex';
import remove from 'lodash/remove';

export function inline<T = any>(docs: T[]): SourceProducer {
  return (container: Container, config: CollectionConfig): Collection => {
    let factory = container.get<CollectionFactory<T>>(
      'isimud.MemoryCollectionFactory'
    );
    let collection = factory.createCollection(config, CollectionType.Source);

    for (let doc of docs) {
      collection.upsert(doc);
    }
    return collection;
  };
}

@provider({
  key: 'isimud.MemoryCollectionFactory'
})
export class MemoryCollectionFactory implements CollectionFactory {
  public createCollection(
    config: CollectionConfig, type: CollectionType): Collection
  {
    return new MemoryCollection(config.name + '.' + type);
  }
}

export class MemoryCollection extends EventEmitter implements Collection {
  public docs: any[] = [];

  public constructor(public readonly name = '') {
    super();
  }

  public find(selector?: object, options?: QueryOptions): Promise<any> {
    return Promise.resolve(filter(this.docs, selector || {}));
  }

  public async findOne(selector: object): Promise<any> {
    let docs = await this.find(selector);
    if (docs.length > 0) {
      return Promise.resolve(docs[0]);
    } else {
      return Promise.reject(new Error('Document not found'));
    }
  }

  public upsert(doc: any): Promise<any> {
    const i = findIndex(this.docs, o => o._id === doc._id);
    const clone = cloneDeep(doc);
    if (i >= 0) {
      this.docs[i] = clone;
    } else {
      this.docs.push(clone);
    }
    this.emit('document-upserted', clone);
    return Promise.resolve(clone);
  }

  public remove(selector: any): Promise<any[]> {
    let removed = remove(this.docs, selector);
    for (let doc of removed) {
      this.emit('document-removed', doc);
    }
    return Promise.resolve(removed);
  }

  public async count(selector?: object): Promise<number> {
    return (await this.find(selector)).length;
  }
}
