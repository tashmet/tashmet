import {Newable} from '../reflection/index.js';
import {Resolver, ServiceRequest, ServiceIdentifier} from './interfaces.js';
import {Instance, Cache, Injection} from './resolvers.js';

export interface ProviderConfig<T> {
  /**
   * The unique identifier that the provider supplies an implementation for.
   * By default this will be the class itself.
   */
  key?: ServiceIdentifier<T>;
}

export interface InjectedProviderConfig<T> extends ProviderConfig<T> {
  /**
   * A list of service requests to be resolved and injected.
   */
  inject?: ServiceRequest<any>[];

  /**
   * Create in transient scope (singleton is default).
   */
  transient?: boolean;
}

export interface ClassProviderConfig<T> extends InjectedProviderConfig<T> {
  /**
   * Class constructor.
   */
  ctr: Newable<T>;
}

export interface FactoryProviderConfig<T> extends InjectedProviderConfig<T> {
  key: ServiceIdentifier<T>;

  /**
   * Function creating an instance of T given a set of injected dependencies.
   */
  create: (...args: any[]) => T;
}

export class Provider<T> {
  public static ofInstance<T>(key: ServiceIdentifier<T>, value: T): Provider<T> {
    return Provider.ofResolver(key, new Instance(value));
  }

  public static ofClass<T>(config: ClassProviderConfig<T>): Provider<T> {
    return Provider.ofResolver(
      config.key || config.ctr,
      Injection.ofClass(config.ctr, config.inject || []), config.transient
    );
  }

  public static ofFactory<T>(config: FactoryProviderConfig<T>): Provider<T> {
    return Provider.ofResolver(
      config.key, Injection.of(config.create.bind(config), config.inject || []), config.transient);
  }

  public static ofResolver<T>(
    key: ServiceIdentifier<T>, resolver: Resolver<T>, transient?: boolean
  ): Provider<T> {
    return new Provider(key, transient ? resolver : Cache.of(resolver));
  }

  public constructor(
    public key: ServiceIdentifier<T>,
    public resolver: Resolver<T>
  ) {}
}
