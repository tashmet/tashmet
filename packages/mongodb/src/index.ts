import {Collection as MongoCollection} from 'mongodb';
import {MongoDBCollection} from './collection';
import {CollectionFactory} from '@tashmit/database';

export class MongoCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private collection: MongoCollection) {
    super();
  }

  public async create(name: string) {
    return new MongoDBCollection<T>(this.collection, name);
  }
}

export function mongodb(collection: MongoCollection) {
  return new MongoCollectionFactory(collection);
}
