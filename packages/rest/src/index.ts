import {RestCollectionFactory} from './collection';
import {RestCollectionConfig} from './interfaces';

export * from './interfaces';
export * from './query/filter';
export * from './query/flat';
export * from './query/json';
export * from './query/sort';

export const rest = (config: RestCollectionConfig) => new RestCollectionFactory(config);
