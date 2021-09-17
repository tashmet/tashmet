import {CachingConfig, CachingMiddlewareFactory} from './middleware';

export {CachingConfig};

export const caching = (config?: CachingConfig) => new CachingMiddlewareFactory(config || {});
