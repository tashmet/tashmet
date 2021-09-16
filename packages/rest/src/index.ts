import {RestCollectionFactory} from './collection';
import {RestCollectionConfig} from './interfaces';

export * from './interfaces';
export const rest = (config: RestCollectionConfig) => new RestCollectionFactory(config);
