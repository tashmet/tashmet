import {Logger, Container, Factory} from '@tashmit/core';
import {OperatorConfig} from '@tashmit/operators';
import {OperatorType, useOperators} from "mingo/core";
import {memory} from './collections/memory';
import {withMiddleware} from './collections/managed';
import {view} from './collections/view';
import {validation} from './middleware/validation';
import {
  Collection,
  CollectionConfig,
  CollectionSource,
  Database,
  Middleware,
  MiddlewareFactory,
  ValidatorFactory,
} from './interfaces';

export class DatabaseService extends Database {
  private collections: {[name: string]: Collection} = {};

  public constructor(
    private logger: Logger,
    private container: Container,
    private validatorFactory: ValidatorFactory,
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
    name: string, source: CollectionSource<T>): Collection<T>
  {
    try {
      if (name in this.collections) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }
      const config = this.createConfig(source);
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

  private createConfig<T = any>(source: CollectionSource<T>) {
    if ('viewOf' in source) {
      return {use: source.use, useBefore: source.useBefore, source: view(source)}
    }
    return source instanceof Factory
      ? {source}
      : Array.isArray(source) ? {source: memory({documents: source})} : source;
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
    const middleware = this.createMiddleware(middlewareFactories, source);
    const validator = config.validator;
    if (validator) {
      middleware.push(validation(this.validatorFactory.create(validator)));
    }

    return withMiddleware(source, middleware);
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
