export {
  // IoC
  ServiceIdentifier,
  ServiceRequest,

  // Container
  Container,
  BasicContainer,
  AbstractContainer,

  // Resolvers
  Resolver,
  Instance,
  Cache,
  Injection,
  Lazy,
  Lookup,
  Optional,

  // Bootstrapping
  createContainer,

  // Providers
  ClassProviderAnnotation,
  FactoryProviderAnnotation,
  InjectedProviderAnnotation,
  provider,
  Provider,

  // Logging
  LogLevel,
  LogEvent,
  Logger,
  LoggerConfig,
  LogFormatter,
  Sink,
  SinkFactory,

  // Writers
  consoleWriter,

  // Reflection
  Abstract,
  Constructor,
  Newable,

  // Decorators
  classDecorator,
  methodDecorator,
  parameterDecorator,
  propertyDecorator,

  // Annotation
  Annotation,

} from '@tashmet/core';

export { ChangeStream, ChangeStreamDocument } from '@tashmet/bridge';

export { Collection } from './collection.js';
export { DatabaseService, DefaultDatabaseFactory } from './database.js';
export { AbstractCursor } from './cursor/abstractCursor.js';
export { AggregationCursor } from './cursor/aggregationCursor.js';
export { FindCursor } from './cursor/findCursor.js';
export * from './interfaces.js';
export { AggregateOptions } from './operations/aggregate.js';

import {
  Container,
  Lookup,
  provider,
  Provider,
  BootstrapConfig,
  ServiceRequest,
  PluginConfigurator,
} from '@tashmet/core';
import { Dispatcher, Document } from '@tashmet/bridge';
import { Database, DatabaseFactory } from './interfaces.js';
import { DefaultDatabaseFactory } from './database.js';
import { GlobalAggregationCursor } from './cursor/globalAggregationCursor.js';
import { AggregateOptions } from './operations/aggregate.js';

@provider({
  inject: [Container, DatabaseFactory, Dispatcher]
})
export default class Tashmet {
  public constructor(
    private container: Container,
    private databaseFactory: DatabaseFactory,
    private dispatcher: Dispatcher,
  ) {}

  public db(name: string): Database {
    return this.databaseFactory.createDatabase(name);
  }

  public aggregate<TSchema extends Document = Document>(
    collection: Document[],
    pipeline: Document[],
    options?: AggregateOptions
  ): GlobalAggregationCursor<TSchema> {
    return new GlobalAggregationCursor(collection, this.dispatcher, pipeline, options);
  }

  public resolve<T>(key: ServiceRequest<T>) {
    return this.container.resolve(key);
  }

  public static configure(config?: Partial<BootstrapConfig>) {
    return new PluginConfigurator<Tashmet, any>(Tashmet, config || {})
      .provide(
        Dispatcher,
        DefaultDatabaseFactory,
        Provider.ofResolver(DatabaseFactory, Lookup.of(DefaultDatabaseFactory))
      );
  }
}
