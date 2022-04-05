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

export {Collection} from './collection';
export {DatabaseService, DefaultDatabaseFactory} from './database';
export {applyFindOptions, sortingMap, AbstractCursor} from './cursor';
export {BulkWriteOperation, BulkWriteOperationFactory} from './operations/bulk';
export {DeleteWriter} from './operations/delete';
export {InsertOneWriter} from './operations/insert';
export {ReplaceOneWriter} from './operations/replace';
export {UpdateWriter} from './operations/update';
export * from './changeStream';
export * from './interfaces';
export * from './middleware';
export * from './changeSet';

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
} from '@tashmet/core';
import {BootstrapConfig} from '@tashmet/core/dist/ioc/bootstrap';
import {Database, DatabaseFactory} from './interfaces';
import {DefaultDatabaseFactory} from './database';

export interface Configuration extends LoggerConfig, BootstrapConfig {}

interface Plugin<TConf> {
  configure(conf: TConf): (container: Container) => void;
}

export class TashmetConfigurator {
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
    return this.bootstrap(Tashmet);
  }

  public async bootstrap<T>(app: Newable<T>): Promise<T> {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    container.register(DefaultDatabaseFactory);
    container.register(Provider.ofResolver(DatabaseFactory, Lookup.of(DefaultDatabaseFactory)));
    container.register(Tashmet);

    for (const plugin of this.plugins) {
      plugin(container);
    }

    for (const provider of this.providers) {
      container.register(provider);
    }

    if (!container.isRegistered(app)) {
      container.register(app);
    }

    return container.resolve(app);
  }
}

@provider({
  inject: [DatabaseFactory]
})
export default class Tashmet {
  public constructor(
    private databaseFactory: DatabaseFactory,
  ) {}

  public db(name: string): Database {
    return this.databaseFactory.createDatabase(name);
  }

  public static configure(config: Partial<Configuration> = {}) {
    return new TashmetConfigurator(
      config.container,
      config.logLevel,
      config.logFormat,
    );
  }
}
