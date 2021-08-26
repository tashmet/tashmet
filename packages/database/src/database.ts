import {provider, Logger} from '@ziqquratu/core';
import {ManagedCollection} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionFactory,
  Database,
  DatabaseConfig,
  Middleware,
  MiddlewareFactory,
} from './interfaces';

@provider({
  key: Database,
  inject: [
    'ziqquratu.DatabaseConfig',
    'ziqquratu.DatabaseLogger',
  ]
})
export class DatabaseService extends Database {
  private collections: {[name: string]: Promise<Collection>} = {};
  private logger: Logger;

  public constructor(
    private config: DatabaseConfig,
    logger: Logger,
  ) {
    super();
    this.logger = logger.inScope('DatabaseService');
    for (const name of Object.keys(config.collections)) {
      this.createCollection(name, config.collections[name]);
    }
  }

  public collection(name: string): Promise<Collection> {
    if (Object.keys(this.collections).includes(name)) {
      return this.collections[name];
    }
    throw new Error(`no collection named '${name}' exists in database`);
  }

  public createCollection<T = any>(
    name: string, factory: CollectionFactory<T> | CollectionConfig): Promise<Collection<T>>
  {
    try {
      if (name in this.collections) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }

      const config: CollectionConfig = factory instanceof CollectionFactory
        ? {source: factory}
        : factory;

      return this.collections[name] = this.createManagedCollection(name, config)
        .then(collection => {
          collection.on('document-upserted', (doc: any) => {
            this.emit('document-upserted', doc, collection);
          });
          collection.on('document-removed', (doc: any) => {
            this.emit('document-removed', doc, collection);
          });
          collection.on('document-error', (err: any) => {
            this.emit('document-error', err, collection);
          });
          this.logger.inScope('createCollection').info(collection.toString());
          return collection;
        });
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  private async createManagedCollection<T = any>(
    name: string, config: CollectionConfig): Promise<Collection<T>>
  {
    const source = await config.source.create(name, this);
    const middlewareFactories = [
      ...(config.useBefore || []),
      ...(this.config.use || []),
      ...(config.use || [])
    ];
    return new ManagedCollection(name, source, await this.createMiddleware(middlewareFactories, source));
  }

  private async createMiddleware(
    factories: MiddlewareFactory[],
    source: Collection
  ): Promise<Middleware[]> {
    return Promise.all(factories.reduce((middleware, factory) => {
      return middleware.concat(factory.create(source, this));
    }, [] as Promise<Middleware>[]));
  }
}
