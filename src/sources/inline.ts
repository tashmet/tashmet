import {Injector} from '@ziggurat/tiamat';
import {Collection, LocalDatabase} from '../interfaces';

export function inline(name: string, docs: any[]) {
  return (injector: Injector): Collection => {
    let collection = injector.get<LocalDatabase>('isimud.LocalDatabase')
      .createCollection(name);
    docs.forEach((doc: any) => {
      collection.upsert(doc);
    });
    return collection;
  };
}
