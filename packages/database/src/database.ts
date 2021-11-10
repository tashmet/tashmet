import {Logger, Container, Factory} from '@tashmit/core';
import {OperatorConfig} from '@tashmit/operators';
import {OperatorType, useOperators} from "mingo/core";
import {memory} from './collections/memory';
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
  private collections: {[name: string]: Collection} = {};

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

  public collection(name: string): Collection {
    if (Object.keys(this.collections).includes(name)) {
      return this.collections[name];
    }
    return this.createCollection(name, memory());
  }

  public createCollection<T = any>(
    name: string, source: CollectionFactory<T> | CollectionConfig | T[]): Collection<T>
  {
    try {
      if (name in this.collections) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }

      const config: CollectionConfig = source instanceof Factory
        ? {source}
        : Array.isArray(source) ? {source: memory({documents: source})} : source;

      const c = this.collections[name] = this.createManagedCollection(name, config);
      c.on('change', change => this.emit('change', change));
      c.on('error', error => this.emit('error', error));
      this.logger.inScope('createCollection').info(c.toString());
      return c;
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  private createManagedCollection<T = any>(
    name: string, config: CollectionConfig): Collection<T>
  {
    const fact = config.source instanceof Factory
      ? config.source
      : memory({documents: config.source})

    const source = fact.resolve(this.container)({name, database: this});

    const middlewareFactories = [
      ...(config.useBefore || []),
      ...(this.middleware || []),
      ...(config.use || [])
    ];
    return withMiddleware(source, this.createMiddleware(middlewareFactories, source));
  }

  private createMiddleware(
    factories: MiddlewareFactory[],
    collection: Collection
  ): Middleware[] {
    const middleware: Middleware[] = [];
    for (const factory of factories) {
      middleware.push(factory.resolve(this.container)({collection, database: this}));
    }
    return middleware;
  }
}
