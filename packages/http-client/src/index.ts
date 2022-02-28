import {Container, Logger, Optional, provider, Provider} from '@tashmit/core';
import {CachingLayer, Client, Database} from '@tashmit/database';
import {QuerySerializer} from '@tashmit/qs-builder';
import {HttpClientConfig} from './interfaces';
import {HttpDatabase} from './database';

export * from './interfaces';
export {QuerySerializer} from '@tashmit/qs-builder';


@provider({
  key: HttpClient,
  inject: [
    HttpClientConfig,
    Logger.inScope('http-client'),
    Optional.of(CachingLayer),
  ]
})
export default class HttpClient extends Client<Database> {
  private static defaultConfig: HttpClientConfig = {
    fetch: typeof window !== 'undefined' ? window.fetch : undefined,
    querySerializer: QuerySerializer.json(),
    headers: {},
  }

  public static configure(config: Partial<HttpClientConfig> = {}) {
    return (container: Container) => {
      container.register(Provider.ofInstance(HttpClientConfig, {...HttpClient.defaultConfig, ...config}));
      container.register(HttpClient);
    }
  }

  public constructor(
    private config: HttpClientConfig,
    private logger: Logger,
    private cachingLayer?: CachingLayer)
  {
    super();
  }

  db(name: string): HttpDatabase {
    return new HttpDatabase(name, this.config, this.logger, this.cachingLayer);
  }
}
