import {
  Container,
  Logger,
  provider,
  Provider,
} from '@tashmet/tashmet';
import { QuerySerializer } from '@tashmet/qs-builder';
import {
  DatabaseEngine,
  makeCreateCommand,
  makeDeleteCommand,
  makeDropCommand,
  makeFindCommand,
  makeGetMoreCommand,
  makeInsertCommand,
  QueryEngine
} from '@tashmet/engine';
import { HttpRestLayer } from './common';
import { HttpClientConfig, HttpStoreConfig, Fetch } from './interfaces';
import { HttpQueryable } from './query';
import { HttpStorageEngine } from './storage';

export * from './interfaces';
export { QuerySerializer } from '@tashmet/qs-builder';

export class HttpDatabaseEngine extends DatabaseEngine {
  public constructor(
    store: HttpStorageEngine,
    query: QueryEngine,
  ) {
    super(store.databaseName, {
      $create: makeCreateCommand(store),
      $delete: makeDeleteCommand(store, query),
      $drop: makeDropCommand(store),
      $find: makeFindCommand(query),
      $getMore: makeGetMoreCommand(query),
      $insert: makeInsertCommand(store),
    });
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
    //private cachingLayer: CachingLayer | undefined,
  ) {}

  public createApi(config: HttpStoreConfig): DatabaseEngine {
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

    const restLayer = new HttpRestLayer(path, loggedFetch);
    const storage = new HttpStorageEngine(config.ns.db, restLayer);
    const qEngine = new QueryEngine(new HttpQueryable(querySerializer, restLayer));
    const dbEngine = new HttpDatabaseEngine(storage, qEngine);

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
