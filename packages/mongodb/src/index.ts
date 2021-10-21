import {MongoDBCollection} from './collection';
import {CollectionFactory} from '@tashmit/database';
import {MongoDBCollectionConfig} from './interfaces';

export class MongoCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private config: MongoDBCollectionConfig) {
    super();
  }

  public async create(name: string) {
    return MongoDBCollection.fromConfig<T>(name, this.config);
  }
}

export function mongodb(config: MongoDBCollectionConfig) {
  return new MongoCollectionFactory(config);
}
