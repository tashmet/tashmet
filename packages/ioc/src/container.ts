import {Constructor, Newable} from '@ziqquratu/reflection';
import {Container, ServiceIdentifier, ServiceRequest, Resolver} from './interfaces';
import {Provider} from './provider';
import {ClassProviderAnnotation, FactoryProviderAnnotation} from './decorators/provider';

/**
 * Abstract container that can be overridden to plug into an existing DI framework.
 */
export abstract class AbstractContainer implements Container {
  public resolve<T>(req: ServiceRequest<T>): T {
    return req instanceof Resolver ? req.resolve(this) : this.get(req);
  }

  public register<T>(provider: Provider<T> | Newable<T>): void {
    if (provider instanceof Provider) {
      return this.registerResolver(provider.key, provider.resolver);
    }
    if (ClassProviderAnnotation.existsOnClass(provider)) {
      const config = ClassProviderAnnotation.onClass(provider)[0];
      return this.register(Provider.ofClass(config));
    }
    if (FactoryProviderAnnotation.existsOnClass(provider)) {
      const config = FactoryProviderAnnotation.onClass(provider)[0];
      return this.register(Provider.ofFactory(config));
    }
    this.register(Provider.ofClass({ctr: provider}));
  }

  public abstract isRegistered<T>(key: ServiceIdentifier<T>): boolean;

  protected abstract registerResolver<T>(key: ServiceIdentifier<any>, resolver: Resolver<T>): void;

  protected abstract get<T>(key: ServiceIdentifier<T>): T;
}

/**
 * Basic container with a map of resolvers.
 */
export class BasicContainer extends AbstractContainer {
  private resolvers: Map<ServiceIdentifier<any>, Resolver<any>>;

  public constructor() {
    super();
    this.resolvers = new Map();
  }

  public isRegistered<T>(key: ServiceIdentifier<T>): boolean {
    return this.resolvers.has(key);
  }

  protected registerResolver<T>(key: ServiceIdentifier<any>, resolver: Resolver<T>): void {
    this.resolvers.set(key, resolver);
  }

  protected get<T>(key: ServiceIdentifier<T>): T {
    const res = this.resolvers.get(key);

    if (!res) {
      throw Error('No resolver registered for key: ' + this.nameOf(key));
    }
    return res.resolve(this);
  }

  private nameOf<T>(key: ServiceIdentifier<T>): string {
    if (typeof key === 'string') {
      return key;
    }
    if (typeof key === 'symbol') {
      return key.toString();
    }
    return (key as Constructor<T>).name || '';
  }
}
