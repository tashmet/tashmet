import {
  CollectionFactory,
  Database,
} from '../interfaces';

export class ProxyCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private collection: string) {
    super();
  }

  public create(name: string, database: Database) {
    return database.collection(this.collection);
  }
}

export function proxy<T = any>(collection: string) {
  return new ProxyCollectionFactory(collection);
}
