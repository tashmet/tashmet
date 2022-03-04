import {Logger} from '@tashmit/core';
import {CachingLayer, Collection, withMiddleware, AbstractDatabase} from '@tashmit/database';
import {HttpDriver} from './driver';
import {HttpRestLayer} from './common';
import {Fetch, HttpCreateCollectionOptions, HttpClientConfig} from './interfaces';


export class HttpDatabase extends AbstractDatabase<HttpDriver<any>> {
  public constructor(
    name: string,
    private config: HttpClientConfig,
    private logger: Logger,
    private cachingLayer: CachingLayer | undefined,
  ) { super(name); }

  public createCollection<T = any>(name: string, configOrPath: HttpCreateCollectionOptions | string): Collection<T> {
    const config: HttpCreateCollectionOptions = typeof configOrPath === 'string'
      ? {path: configOrPath}
      : configOrPath;

    const {path, /*emitter,*/ querySerializer, fetch} = {
      ...this.config,
      ...config,
    };

    const logger = this.logger.inScope(`HttpCollection (${this.databaseName})`)

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

    const driver = new HttpDriver<T>(
      {db: this.databaseName, coll: name}, new HttpRestLayer(path, loggedFetch), querySerializer
    );
    let collection: Collection<T> = new Collection<T>(driver, this);

    if (this.cachingLayer) {
      collection = withMiddleware<T>(collection, [this.cachingLayer.create(collection)]);
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
    return collection;
  }
}
