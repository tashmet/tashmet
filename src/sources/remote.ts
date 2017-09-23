import {Injector} from '@ziggurat/tiamat';
import {Collection, CollectionFactory, RemoteCollectionConfig} from '../interfaces';

export function remote(path: string, name: string): any {
  return (injector: Injector): Collection => {
    let factory = injector.get<CollectionFactory<RemoteCollectionConfig>>(
      'isimud.RemoteCollectionFactory'
    );
    return factory.createCollection(name, {path});
  };
}
