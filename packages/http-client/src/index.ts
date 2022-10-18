import {
  Container,
  Dispatcher,
  Logger,
  provider,
  Provider,
} from '@tashmet/tashmet';
import { QuerySerializer } from '@tashmet/qs-builder';
import {
  AbstractAggregator,
  AggregatorFactory,
  StorageEngine,
  Document,
  QueryEngine,
  AdminController,
  QueryController,
} from '@tashmet/engine';
import { DefaultHttpRestLayer } from './common';
import { HttpClientConfig, HttpStoreConfig, Fetch } from './interfaces';
import { HttpQueryable } from './query';
import { HttpStorage } from './storage';

export * from './interfaces';
export { QuerySerializer } from '@tashmet/qs-builder';

class NullAggregatorFactory implements AggregatorFactory {
  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    throw new Error("No aggregator");
  }
}

@provider({
  key: Http,
  inject: [
    HttpClientConfig,
    Logger.inScope('http-client'),
    //Optional.of(CachingLayer),
  ]
})
export default class Http {
  private static defaultConfig: HttpClientConfig = {
    basePath: '',
    fetch: typeof window !== 'undefined' ? window.fetch : undefined,
    querySerializer: QuerySerializer.json(),
    headers: {},
    databases: {}
  }

  public static configure(config: Partial<HttpClientConfig> = {}) {
    return (container: Container) => {
      container.register(Http);
      container.register(Provider.ofInstance(HttpClientConfig, {...Http.defaultConfig, ...config}));

      return () => {
        const httpClient = container.resolve(Http);

        for (const [dbName, dbConfig] of Object.entries(config.databases || {})) {
          container
            .resolve(Dispatcher)
            .addStorageEngine(httpClient.createApi(dbName, dbConfig));
        }
      }
    }
  }

  public constructor(
    private config: HttpClientConfig,
    private logger: Logger,
    //private cachingLayer: CachingLayer | undefined,
  ) {}

  public createApi(dbName: string, config: HttpStoreConfig): StorageEngine {
    const {basePath, path, /*emitter,*/ querySerializer, fetch} = {
      ...this.config,
      ...config,
    };

    const logger = this.logger.inScope(`HttpCollection (${dbName})`)

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

    const restLayer = new DefaultHttpRestLayer(basePath || '', path, loggedFetch);
    const storage = new HttpStorage(dbName, restLayer);
    const qEngine = new QueryEngine(new HttpQueryable(querySerializer, restLayer));
    //const engine = new PrefetchAggregationEngine(storage, new NullAggregatorFactory(), new HttpQueryable(querySerializer, restLayer));
    //const engine = new QueryEngine(new HttpQueryable(querySerializer, restLayer));
    //const dbEngine = new HttpDatabaseEngine(storage, engine);
    const storageEngine = StorageEngine.fromControllers(dbName,
      new AdminController(storage, undefined), new QueryController(dbName, storage, qEngine)
    );

    /*
    if (this.cachingLayer) {
      //return withMiddleware<TSchema>(store, [this.cachingLayer.create(store)]);
      return store;
    } else {
      logger.warn('No caching layer available');
    }
    */
    /*
    if (emitter) {
      emitter(collection, path)
        .on('change', change => collection.emit('change', change))
        .on('error', error => collection.emit('error', error));
      return collection;
    }
    */
    return storageEngine;
  }
}
