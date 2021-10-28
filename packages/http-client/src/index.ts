import {component, Factory, Provider} from '@tashmit/core';
import {CollectionFactory, withAutoEvent} from '@tashmit/database';
import {RestCollection} from './collection';
import {HttpCollectionConfig, HttpClientConfig} from './interfaces';

export * from './interfaces';


@component({
  providers: [
    Provider.ofInstance('tashmit.HttpClientConfig', {}),
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

      if (!querySerializer) {
        throw Error('No query serializer configured');
      }
      if (!fetch) {
        throw Error('No fetch implementation configured');
      }

      const collection = new RestCollection<T>(name, database, path, querySerializer, fetch);

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
