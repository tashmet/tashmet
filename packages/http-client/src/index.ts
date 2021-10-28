import {component, Factory, Logger, Provider} from '@tashmit/core';
import {CollectionFactory, withAutoEvent} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpCollection} from './collection';
import {Fetch, HttpCollectionConfig, HttpClientConfig} from './interfaces';

export * from './interfaces';

@component({
  providers: [
    Provider.ofInstance<HttpClientConfig>('tashmit.HttpClientConfig', {
      fetch: typeof window !== 'undefined' ? window.fetch : undefined,
      querySerializer: QuerySerializer.json(),
    }),
  ]
})
export default class HttpClient {
  /**
   * A factory creating an HTTP database collection.
   *
   * @param configOrPath A path to the API endpoint or a configuration.
   * @returns An HTTP database collection
   */
  public static collection<T = any>(configOrPath: HttpCollectionConfig | string): CollectionFactory<T> {
    return Factory.of(async ({name, database, container}) => {
      const config: HttpCollectionConfig = typeof configOrPath === 'string'
        ? {path: configOrPath}
        : configOrPath;

      const {path, emitter, querySerializer, fetch} = {
        ...container.resolve<HttpClientConfig>('tashmit.HttpClientConfig'),
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

      const collection = new HttpCollection<T>(
        name, database, path, querySerializer, loggedFetch
      );

      if (emitter) {
        emitter(collection, path)
          .on('change', change => collection.emit('change', change))
          .on('error', error => collection.emit('error', error));
        return collection;
      }
      return withAutoEvent(collection);
    });
  }

  public static configuration(config: HttpClientConfig) {
    return Provider.ofInstance('tashmit.HttpClientConfig', config);
  }
}
