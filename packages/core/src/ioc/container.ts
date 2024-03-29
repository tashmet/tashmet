import {Constructor, Newable} from '../reflection/index.js';
import {Logger} from '../logging/interfaces.js';
import {DefaultLogger} from '../logging/logger.js';
import {Container, ServiceIdentifier, ServiceRequest, Resolver} from './interfaces.js';
import {Provider} from './provider.js';
import {ClassProviderAnnotation, FactoryProviderAnnotation} from './decorators/provider.js';

/**
 * Abstract container that can be overridden to plug into an existing DI framework.
 */
export abstract class AbstractContainer extends Container {
  public constructor(protected logger: Logger) { super(); }

  public resolve<T>(req: ServiceRequest<T>): T {
    if (req instanceof Resolver) {
      return req.resolve(this);
    }
    this.logger.inScope('resolve').debug(`key '${this.nameOf(req)}'`);
    return this.get(req);
  }

  public register<T>(provider: Provider<T> | Newable<T>): void {
    if (provider instanceof Provider) {
      this.logger.inScope('register').debug(`key '${this.nameOf(provider.key)}'`);
      return this.registerResolver(provider.key, provider.resolver);
    }
    if (ClassProviderAnnotation.existsOnClass(provider)) {
      const config = ClassProviderAnnotation.onClass(provider)[0];
      const paramTypes = Reflect.getOwnMetadata('design:paramtypes', provider);
      return this.register(Provider.ofClass(config.inject.length === 0
        ? {...config, inject: paramTypes}
        : config
      ));
    }
    if (FactoryProviderAnnotation.existsOnClass(provider)) {
      const config = FactoryProviderAnnotation.onClass(provider)[0];
      return this.register(Provider.ofFactory(config));
    }
    this.logger.inScope('register').debug(`key '${this.nameOf(provider)}'`);
    this.register(Provider.ofClass({ctr: provider}));
  }

  public abstract isRegistered<T>(key: ServiceIdentifier<T>): boolean;

  protected abstract registerResolver<T>(key: ServiceIdentifier<any>, resolver: Resolver<T>): void;

  protected abstract get<T>(key: ServiceIdentifier<T>): T;

  protected nameOf<T>(key: ServiceIdentifier<T>): string {
    if (typeof key === 'string') {
      return key;
    }
    if (typeof key === 'symbol') {
      return key.toString();
    }
    return (key as Constructor<T>).name || '';
  }
}

/**
 * Basic container with a map of resolvers.
 */
export class BasicContainer extends AbstractContainer {
  private resolvers: Map<ServiceIdentifier<any>, Resolver<any>>;

  public constructor(logger: Logger = new DefaultLogger()) {
    super(logger.inScope('BasicContainer'));
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
      throw Error('no resolver registered for key: ' + this.nameOf(key));
    }
    return res.resolve(this);
  }
}
