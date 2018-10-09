import {Injector} from '@ziggurat/tiamat';
import {CollectionConfig, SourceProducer} from '../database/interfaces';
import {Collection, CollectionFactory, CollectionType} from '../interfaces';
import {Document} from '../models/document';

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
