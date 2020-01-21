export * from '@ziqquratu/database';
export * from '@ziqquratu/reflection';
export {
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
  bootstrapWithContainer,

  // Factory
  Factory,

  // Component
  ComponentConfig,

  // Provider
  ClassProviderAnnotation,
  FactoryProviderAnnotation,
  InjectedProviderAnnotation,
  provider,
  Provider,
} from '@ziqquratu/ioc';

import DatabaseComponent from '@ziqquratu/database';
import * as ioc from '@ziqquratu/ioc';
import {Newable} from '@ziqquratu/reflection';

/**
 * Component class decorator.
 *
 * Turns a class into a component which is a collection of providers.
 * A component can have dependencies on other components which means that it can
 * consume whatever those components provide.
 *
 * This is a redefinition of component decorator found in @ziqquratu/ioc
 * which includes a dependency on @ziqquratu/database.
 */
export const component = (config?: ioc.ComponentConfig) => {
  config = config || {};
  config.dependencies = (config.dependencies || []).concat(DatabaseComponent);
  return ioc.component(config);
};
