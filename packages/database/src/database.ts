import {Logger, Container, Factory} from '@tashmit/core';
import {OperatorConfig} from '@tashmit/operators';
import {OperatorType, useOperators} from "mingo/core";
import {withMiddleware} from './collections/managed';
import {
  Collection,
  CollectionConfig,
  CollectionFactory,
  Database,
  Middleware,
  MiddlewareFactory,
} from './interfaces';

export class DatabaseService extends Database {
  private collections: {[name: string]: Promise<Collection>} = {};

  public constructor(
    private logger: Logger,
    private container: Container,
    operators: OperatorConfig = {},
    private middleware: MiddlewareFactory[] = [],
  ) {
    super();
    const {accumulator, expression, pipeline, projection, query} = operators;

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
    name: string, factoryOrConfig: CollectionFactory<T> | CollectionConfig): Promise<Collection<T>>
  {
    try {
      if (name in this.collections) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }

      const config: CollectionConfig = factoryOrConfig instanceof Factory
        ? {source: factoryOrConfig}
        : factoryOrConfig;

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
    const source = await config.source.resolve(this.container)({name, database: this});
    const middlewareFactories = [
      ...(config.useBefore || []),
      ...(this.middleware || []),
      ...(config.use || [])
    ];
    return withMiddleware(source, await this.createMiddleware(middlewareFactories, source));
  }

  private async createMiddleware(
    factories: MiddlewareFactory[],
    collection: Collection
  ): Promise<Middleware[]> {
    const middleware: Middleware[] = [];
    for (const factory of factories) {
      middleware.push(await factory.resolve(this.container)({collection, database: this}));
    }
    return middleware;
  }
}
