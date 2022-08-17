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
  AbstractDatabaseEngine,
  AggregatorFactory,
  DatabaseEngine,
  Document,
  makeCountQueryCommand,
  makeCreateCommand,
  makeDeleteCommand,
  makeDropCommand,
  makeFindCommand,
  makeGetMoreCommand,
  makeInsertCommand,
  makeUpdateQueryCommand,
} from '@tashmet/engine';
import { DefaultHttpRestLayer } from './common';
import { HttpClientConfig, HttpStoreConfig, Fetch } from './interfaces';
import { HttpQueryable } from './query';
import { HttpStorageEngine } from './storage';
import { AggregationEngine, PrefetchAggregationEngine } from '@tashmet/engine/dist/aggregation';

export * from './interfaces';
export { QuerySerializer } from '@tashmet/qs-builder';

export class HttpDatabaseEngine extends AbstractDatabaseEngine {
  public constructor(
    store: HttpStorageEngine,
    engine: AggregationEngine,
  ) {
    super(store.databaseName, {
      $create: makeCreateCommand(store),
      $count: makeCountQueryCommand(engine),
      $delete: makeDeleteCommand(store, engine),
      $drop: makeDropCommand(store),
      $find: makeFindCommand(engine),
      $getMore: makeGetMoreCommand(engine),
      $insert: makeInsertCommand(store),
      $update: makeUpdateQueryCommand(store, engine),
    });
  }
}

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
            .addDatabaseEngine(httpClient.createApi(dbName, dbConfig));
        }
      }
    }
  }

  public constructor(
    private config: HttpClientConfig,
    private logger: Logger,
    //private cachingLayer: CachingLayer | undefined,
  ) {}

  public createApi(dbName: string, config: HttpStoreConfig): DatabaseEngine {
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
    const storage = new HttpStorageEngine(dbName, restLayer);
    //const qEngine = new QueryEngine(new HttpQueryable(querySerializer, restLayer));
    const engine = new PrefetchAggregationEngine(storage, new NullAggregatorFactory(), new HttpQueryable(querySerializer, restLayer));
    const dbEngine = new HttpDatabaseEngine(storage, engine);

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
    return dbEngine;
  }
}
