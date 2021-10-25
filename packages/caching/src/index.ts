import {CachingConfig, cachingMiddleware} from './middleware';

export {CachingConfig};

export const caching = (config?: CachingConfig) => cachingMiddleware(config || {});
