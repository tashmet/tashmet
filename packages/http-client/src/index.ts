import {Container, Logger, Optional, provider, Provider} from '@tashmit/core';
import {CachingLayer, Store, withMiddleware} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpRestLayer} from './common';
import {HttpClientConfig, HttpStoreConfig, Fetch} from './interfaces';
import {HttpStore} from './store';

export * from './interfaces';
export {QuerySerializer} from '@tashmit/qs-builder';

@provider({
  key: Http,
  inject: [
    HttpClientConfig,
    Logger.inScope('http-client'),
    Optional.of(CachingLayer),
  ]
})
export default class Http {
  private static defaultConfig: HttpClientConfig = {
    fetch: typeof window !== 'undefined' ? window.fetch : undefined,
    querySerializer: QuerySerializer.json(),
    headers: {},
  }

  public static configure(config: Partial<HttpClientConfig> = {}) {
    return (container: Container) => {
      container.register(Provider.ofInstance(HttpClientConfig, {...Http.defaultConfig, ...config}));
      container.register(Http);
    }
  }

  public constructor(
    private config: HttpClientConfig,
    private logger: Logger,
    private cachingLayer: CachingLayer | undefined,
  ) {}

  public createApi<TSchema extends Document = any>(config: HttpStoreConfig): Store<TSchema> {
    const {path, /*emitter,*/ querySerializer, fetch} = {
      ...this.config,
      ...config,
    };

    const logger = this.logger.inScope(`HttpCollection (${config.ns.db})`)

    if (!querySerializer) {
      throw Error('No query serializer configured');
    }
    if (!fetch) {
      throw Error('No fetch implementation configured');
    }

    const loggedFetch: Fetch = (input, init) => {
      logger.info(`${init?.method || 'GET'} '${input}'`);
      return fetch(input, init);
    }

    let store = new HttpStore<TSchema>(config.ns, new HttpRestLayer(path, loggedFetch), querySerializer);

    if (this.cachingLayer) {
      return withMiddleware<TSchema>(store, [this.cachingLayer.create(store)]);
    } else {
      logger.warn('No caching layer available');
    }
    /*
    if (emitter) {
      emitter(collection, path)
        .on('change', change => collection.emit('change', change))
        .on('error', error => collection.emit('error', error));
      return collection;
    }
    */
    return store;
  }
}
