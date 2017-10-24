import {Injector} from '@ziggurat/tiamat';
import {SourceProvider} from '../database/interfaces';
import {Collection, CollectionFactory, RemoteCollectionConfig} from '../interfaces';

export function remote(path: string, name: string): SourceProvider {
  return (injector: Injector, model: string): Collection => {
    let factory = injector.get<CollectionFactory<RemoteCollectionConfig>>(
      'isimud.RemoteCollectionFactory'
    );
    return factory.createCollection(name, {path});
  };
}
