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

  // Component
  ComponentConfig,

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
  CollectionFactory,
  CollectionConfig,
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
      [],
      config.use,
      config.collections,
      config.operators,
      config.logLevel,
      config.logFormat,
    );
  }

  public constructor(
    private container: ((logger: Logger) => Container) | undefined = undefined,
    private providers: (Provider<any> | Newable<any> | Plugin)[] = [],
    private middleware: MiddlewareFactory[] = [],
    private collections: Record<string, CollectionFactory | CollectionConfig> = {},
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

  public collection(name: string, factOrConfig: CollectionFactory | CollectionConfig) {
    this.collections[name] = factOrConfig;
    return this;
  }

  public bootstrap<T>(app: ServiceRequest<T>, fn?: (instance: T) => void): T {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    })

    DatabasePlugin
      .configure({
        operators: this.operators,
        collections: this.collections,
        use: this.middleware,
      })
      .register(container);

    for (const provider of this.providers) {
      container.register(provider);
    }
    const instance = container.resolve(app);
    if (fn) {
      fn(instance)
    }
    return instance;
  }
}
