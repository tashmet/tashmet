import {Container, Factory, Logger, Plugin, Provider} from '@tashmit/core';
import {CachingLayer, Collection, CollectionFactory, withAutoEvent, withMiddleware} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpCollection} from './collection';
import { HttpRestLayer } from './common';
import {Fetch, HttpCollectionConfig, HttpClientConfig} from './interfaces';

export * from './interfaces';
export {QuerySerializer} from '@tashmit/qs-builder';

export default class HttpClient extends Plugin {
  private static defaultConfig: HttpClientConfig = {
    fetch: typeof window !== 'undefined' ? window.fetch : undefined,
    querySerializer: QuerySerializer.json(),
    headers: {},
  }

  private config: HttpClientConfig;

  public constructor(config: Partial<HttpClientConfig> = {}) {
    super();
    this.config = {...HttpClient.defaultConfig, ...config};
  }

  public register(container: Container) {
    container.register(Provider.ofInstance(HttpClientConfig, this.config));
  }

  /**
   * A factory creating an HTTP database collection.
   *
   * @param configOrPath A path to the API endpoint or a configuration.
   * @returns An HTTP database collection
   */
  public static collection<T = any>(configOrPath: HttpCollectionConfig | string): CollectionFactory<T> {
    return Factory.of(({name, database, container}) => {
      const config: HttpCollectionConfig = typeof configOrPath === 'string'
        ? {path: configOrPath}
        : configOrPath;

      const {path, emitter, querySerializer, fetch} = {
        ...container.resolve(HttpClientConfig),
        ...config,
      };

      const logger = container.resolve(
        Logger.inScope(`http-client.HttpCollection (${name})`)
      );

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

      let collection: Collection<T> = new HttpCollection<T>(
        name, database, new HttpRestLayer(path, loggedFetch), querySerializer
      );

      try {
        const cachingLayer = container.resolve(CachingLayer);
        collection = withMiddleware(collection, [cachingLayer.create(collection)]);
      } catch (error) {
        logger.warn('No caching layer available');
      }

      if (emitter) {
        emitter(collection, path)
          .on('change', change => collection.emit('change', change))
          .on('error', error => collection.emit('error', error));
        return collection;
      }
      return withAutoEvent(collection);
    });
  }
}
