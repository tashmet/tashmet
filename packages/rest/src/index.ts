import {Factory} from '@tashmit/core';
import {CollectionFactory} from '@tashmit/database';
import {RestCollection} from './collection';
import {RestCollectionConfig} from './interfaces';

export * from './interfaces';
export * from './query/filter';
export * from './query/flat';
export * from './query/json';
export * from './query/nested';
export * from './query/projection';
export * from './query/sort';

export function rest<T = any>(config: RestCollectionConfig): CollectionFactory<T> {
  return Factory.of(async ({name, database}) => RestCollection.fromConfig(name, database, config));
}
