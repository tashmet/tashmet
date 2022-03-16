export * from '@tashmit/database';
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

} from '@tashmit/core';

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
  Resolver,
  ServiceRequest,
} from '@tashmit/core';
import {
  Database,
  DatabaseFactory,
  DefaultDatabaseFactory,
} from '@tashmit/database';
import {BootstrapConfig} from '@tashmit/core/dist/ioc/bootstrap';

export interface Configuration extends LoggerConfig, BootstrapConfig {}

interface Plugin<TConf> {
  configure(conf: TConf): (container: Container) => void;
}

export class TashmitConfigurator {
  private providers: (Provider<any> | Newable<any>)[] = [];
  private plugins: ((container: Container) => void)[] = [];

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
    return this.bootstrap(Tashmit);
  }

  public async bootstrap<T>(app: ServiceRequest<T>): Promise<T> {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    container.register(DefaultDatabaseFactory);
    container.register(Provider.ofResolver(DatabaseFactory, Lookup.of(DefaultDatabaseFactory)));
    container.register(Tashmit);

    for (const plugin of this.plugins) {
      plugin(container);
    }

    for (const provider of this.providers) {
      container.register(provider);
    }

    return container.resolve(app);
  }
}

@provider({
  inject: [DatabaseFactory]
})
export default class Tashmit {
  public constructor(
    private databaseFactory: DatabaseFactory,
  ) {}

  public db(name: string): Database {
    return this.databaseFactory.createDatabase(name);
  }

  public static configure(config: Partial<Configuration> = {}) {
    return new TashmitConfigurator(
      config.container,
      config.logLevel,
      config.logFormat,
    );
  }
}
