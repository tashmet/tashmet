import {Injector} from '@ziggurat/tiamat';
import {SourceProducer} from '../database/interfaces';
import {Collection, CollectionFactory, MemoryCollectionConfig} from '../interfaces';
import {Document} from '../models/document';

export function inline<T extends Document>(name: string, docs: T[]): SourceProducer {
  return (injector: Injector, model: string): Collection => {
    let factory = injector.get<CollectionFactory<MemoryCollectionConfig>>(
      'isimud.MemoryCollectionFactory'
    );
    let collection = factory.createCollection(name, {indices: ['_id']});
    for (let doc of docs) {
      collection.upsert(doc);
    }
    return collection;
  };
}
