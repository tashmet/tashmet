import {provider} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, CollectionType,
  QueryOptions} from '../interfaces';
import {CollectionConfig, SourceProducer} from '../database/interfaces';
import {Document} from '../models/document';
import {EventEmitter} from 'eventemitter3';
import {cloneDeep, filter, findIndex, remove} from 'lodash';
import {Injector} from '@ziggurat/tiamat';

export function inline<T extends Document>(docs: T[]): SourceProducer {
  return (injector: Injector, config: CollectionConfig): Collection => {
    let factory = injector.get<CollectionFactory<T>>(
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
  public docs: Document[] = [];

  public constructor(public readonly name = '') {
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
    const clone = cloneDeep(doc);
    if (i >= 0) {
      this.docs[i] = clone;
    } else {
      this.docs.push(clone);
    }
    this.emit('document-upserted', clone);
    return Promise.resolve(clone);
  }

  public remove<T extends Document>(selector: any): Promise<T[]> {
    let removed = remove(this.docs, selector);
    for (let doc of removed) {
      this.emit('document-removed', doc);
    }
    return Promise.resolve(<T[]>removed);
  }

  public async count(selector?: object): Promise<number> {
    return (await this.find(selector)).length;
  }
}
