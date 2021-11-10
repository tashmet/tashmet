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

  // Factory
  Factory,
  AsyncFactory,

  // Providers
  ClassProviderAnnotation,
  FactoryProviderAnnotation,
  InjectedProviderAnnotation,
  provider,
  Provider,
  Plugin,

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

import DatabasePlugin, {
  DatabaseConfig,
  CollectionSource,
  MiddlewareFactory
} from '@tashmit/database';
import {
  Container,
  createContainer,
  Newable,
  Provider,
  Plugin,
  Logger,
  LoggerConfig,
  LogLevel,
  LogFormatter,
  ServiceRequest,
} from '@tashmit/core';
import {BootstrapConfig} from '@tashmit/core/dist/ioc/bootstrap';
import {OperatorConfig} from '@tashmit/operators';

export interface Configuration extends DatabaseConfig, LoggerConfig, BootstrapConfig {}


export default class Tashmit {
  public static withConfiguration(config: Partial<Configuration>) {
    return new Tashmit(
      config.container,
      config.operators,
      config.logLevel,
      config.logFormat,
    );
  }

  private providers: (Provider<any> | Newable<any> | Plugin)[] = [];
  private middleware: MiddlewareFactory[] = [];
  private collections: Record<string, CollectionSource<any>> = {};

  public constructor(
    private container: ((logger: Logger) => Container) | undefined = undefined,
    private operators: OperatorConfig = {},
    private logLevel: LogLevel = LogLevel.None,
    private logFormat: LogFormatter | undefined = undefined,
  ) {}

  public provide(...providers: (Provider<any> | Newable<any> | Plugin)[]) {
    this.providers.push(...providers);
    return this;
  }

  public use(...middleware: MiddlewareFactory[]) {
    this.middleware.push(...middleware);
    return this;
  }

  public collection<T = any>(name: string, source: CollectionSource<T>) {
    this.collections[name] = source;
    return this;
  }

  public bootstrap<T>(app: ServiceRequest<T>, fn?: (instance: T) => void): T {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    this.providers.unshift(
      new DatabasePlugin({
        operators: this.operators,
        use: this.middleware,
        collections: this.collections,
      })
    );

    for (const provider of this.providers) {
      container.register(provider);
    }

    for (const provider of this.providers) {
      if (provider instanceof Plugin) {
        provider.setup(container);
      }
    }

    const instance = container.resolve(app);
    if (fn) {
      fn(instance)
    }
    return instance;
  }
}
