import {Injector} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, MemoryCollectionConfig} from '../interfaces';

export function inline(name: string, docs: any[]) {
  return (injector: Injector): Collection => {
    let factory = injector.get<CollectionFactory<MemoryCollectionConfig>>(
      'isimud.MemoryCollectionFactory'
    );
    let collection = factory.createCollection(name, {indices: ['_id']});
    docs.forEach((doc: any) => {
      collection.upsert(doc);
    });
    return collection;
  };
}
