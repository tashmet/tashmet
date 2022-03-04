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
  Newable,
  Provider,
  Logger,
  LoggerConfig,
  LogLevel,
  LogFormatter,
  ServiceRequest,
} from '@tashmit/core';
import {BootstrapConfig} from '@tashmit/core/dist/ioc/bootstrap';

export interface Configuration extends LoggerConfig, BootstrapConfig {}

interface Plugin<TConf> {
  configure(conf: TConf): (container: Container) => void;
}

export default class Tashmit {
  public static withConfiguration(config: Partial<Configuration>) {
    return new Tashmit(
      config.container,
      config.logLevel,
      config.logFormat,
    );
  }

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

  public bootstrap<T>(app: ServiceRequest<T>, fn?: (instance: T) => void): T {
    const container = createContainer({
      logFormat: this.logFormat,
      logLevel: this.logLevel,
      container: this.container,
    });

    for (const provider of this.providers) {
      container.register(provider);
    }

    for (const plugin of this.plugins) {
      plugin(container);
    }

    const instance = container.resolve(app);
    if (fn) {
      fn(instance)
    }
    return instance;
  }
}
