import {Factory} from '@tashmit/core';
import {CollectionFactory} from '@tashmit/database';
import {MongoDBCollection} from './collection';
import {MongoDBCollectionConfig} from './interfaces';

export function mongodb<T = any>(config: MongoDBCollectionConfig): CollectionFactory<T> {
  return Factory.of(({name}) => MongoDBCollection.fromConfig<T>(name, config));
}
