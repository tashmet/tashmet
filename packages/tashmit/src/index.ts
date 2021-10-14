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
  bootstrap,

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

import DatabaseComponent from '@tashmit/database';
import * as core from '@tashmit/core';
import {Newable} from '@tashmit/core';

/**
 * Component class decorator.
 *
 * Turns a class into a component which is a collection of providers.
 * A component can have dependencies on other components which means that it can
 * consume whatever those components provide.
 *
 * This is a redefinition of component decorator found in @tashmit/ioc
 * which includes a dependency on @tashmit/database.
 */
export const component = (config?: core.ComponentConfig) => {
  config = config || {};
  config.dependencies = (config.dependencies || []).concat([
    DatabaseComponent,
  ]);
  return core.component(config);
};
