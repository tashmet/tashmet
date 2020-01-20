export * from '@ziqquratu/database';
export * from '@ziqquratu/reflection';
export {
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

/**
 * Redefinition of component decorator to include dependency on @ziqquratuu/database.
 */
export const component = (config?: ioc.ComponentConfig) => {
  config = config || {};
  config.dependencies = (config.dependencies || []).concat(DatabaseComponent);
  return ioc.component(config);
};
