import {OperatorType, useOperators} from "mingo/core";
import {provider, Logger} from '@tashmit/core';
import {withMiddleware} from './collections/managed';
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
    'tashmit.DatabaseConfig',
    'tashmit.DatabaseLogger',
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
    const {accumulator, expression, pipeline, projection, query} = config.operators;
    useOperators(OperatorType.ACCUMULATOR, accumulator || {});
    useOperators(OperatorType.EXPRESSION, expression || {});
    useOperators(OperatorType.PIPELINE, pipeline || {});
    useOperators(OperatorType.PROJECTION, projection || {});
    useOperators(OperatorType.QUERY, query || {});
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
          collection.on('change', change => this.emit('change', change));
          collection.on('error', error => this.emit('error', error));
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
    return withMiddleware(source, await this.createMiddleware(middlewareFactories, source));
  }

  private async createMiddleware(
    factories: (MiddlewareFactory | Middleware)[],
    source: Collection
  ): Promise<Middleware[]> {
    return Promise.all(factories.reduce((middleware, factory) => {
      return middleware.concat(
        factory instanceof MiddlewareFactory
          ? factory.create(source, this)
          : Promise.resolve(factory)
        );
    }, [] as Promise<Middleware>[]));
  }
}
