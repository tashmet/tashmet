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
  createContainer,
  Logger,
  LoggerConfig,
  LogLevel,
  LogFormatter,
  Lookup,
  Newable,
  provider,
  Provider,
  ServiceIdentifier,
} from '@tashmet/core';
import { BootstrapConfig } from '@tashmet/core';
import { Dispatcher } from '@tashmet/bridge';
import { Database, DatabaseFactory } from './interfaces.js';
import { DefaultDatabaseFactory } from './database.js';

export interface Configuration extends LoggerConfig, BootstrapConfig {}

export type PluginConfig = (container: Container) => void | (() => void);

interface Plugin<TConf> {
  configure(conf: TConf): PluginConfig;
}

export class TashmetConfigurator {
  private providers: (Provider<any> | Newable<any>)[] = [];
  private plugins: PluginConfig[] = [];

  public constructor(
    private container: ((logger: Logger) => Container) | undefined = undefined,
    private logLevel: LogLevel = LogLevel.None,
    private logFormat: LogFormatter | undefined = undefined,
  ) {}

  public provide(...providers: (Provider<any> | Newable<any>)[]) {
    this.providers.push(...providers);
    return this;
  }

  public use<TConf>(ctr: Plugin<TConf>, conf: TConf) {
    this.plugins.push(ctr.configure(conf));
    return this;
  }

  public async connect() {
    return this.bootstrap(Tashmet);
  }

  public async bootstrap<T>(app: Newable<T>): Promise<T> {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    container.register(Dispatcher);
    container.register(DefaultDatabaseFactory);
    container.register(Provider.ofResolver(DatabaseFactory, Lookup.of(DefaultDatabaseFactory)));
    container.register(Tashmet);

    const loaders = this.plugins.map(p => p(container));

    for (const provider of this.providers) {
      container.register(provider);
    }

    if (!container.isRegistered(app)) {
      container.register(app);
    }

    for (const loader of loaders) {
      if (typeof loader === 'function') {
        loader();
      }
    }

    return container.resolve(app);
  }
}

@provider({
  inject: [Container, DatabaseFactory]
})
export default class Tashmet {
  public constructor(
    private container: Container,
    private databaseFactory: DatabaseFactory,
  ) {}

  public db(name: string): Database {
    return this.databaseFactory.createDatabase(name);
  }

  public resolve<T>(key: ServiceIdentifier<T>) {
    return this.container.resolve(key);
  }

  public static configure(config: Partial<Configuration> = {}) {
    return new TashmetConfigurator(
      config.container,
      config.logLevel,
      config.logFormat,
    );
  }
}
