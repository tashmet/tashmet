import {Injector} from '@ziggurat/tiamat';
import {SourceProvider} from '../database/interfaces';
import {Collection, CollectionFactory, MemoryCollectionConfig} from '../interfaces';

export function inline(name: string, docs: any[]): SourceProvider {
  return (injector: Injector, model: string): Collection => {
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
