import {Newable} from '../reflection/index.js';
import {Container, Resolver, ServiceRequest, ServiceIdentifier} from './interfaces.js';

/**
 * Resolver that stores an instance of T.
 */
export class Instance<T> extends Resolver<T> {
  constructor(
    protected instance: T
  ) { super(); }

  public resolve(container: Container) {
    return this.instance;
  }
}

/**
 * Resolver that caches the resolved instance of a given service request.
 */
export class Cache<T> extends Instance<T | undefined> {
  public static of<T>(req: ServiceRequest<any>): Cache<T> {
    return new Cache(req);
  }

  constructor(
    public readonly req: ServiceRequest<T>
  ) { super(undefined); }

  public resolve(container: Container) {
    if (!this.instance) {
      this.instance = container.resolve(this.req);
    }
    return this.instance;
  }
}

/**
 * Resolver that injects services from service requests.
 */
export class Injection<T> extends Resolver<T> {
  /**
   * A resolver creating instances of T by injecting dependencies into a given constructor.
   *
   * @param ctr Constructor
   * @param deps List of service requests that will be resolved and injected.
   */
  public static ofClass<T>(ctr: Newable<T>, deps: ServiceRequest<any>[]): Injection<T> {
    return new Injection((...args) => new ctr(...args), deps);
  }

  /**
   * A resolver creating instances of T by injecting dependencies into a given factory function.
   *
   * @param fn Factory function
   * @param deps List of service requests that will be resolved and injected.
   */
  public static of<T>(fn: (...args: any[]) => T, deps: ServiceRequest<any>[]): Injection<T> {
    return new Injection((...args) => fn(...args), deps);
  }

  constructor(
    protected fn: (...args: any[]) => T,
    protected deps: ServiceRequest<any>[]
  ) { super(); }

  public resolve(container: Container) {
    return this.fn(...this.deps.map(dep => container.resolve(dep)));
  }
}

/**
 * Resolver that returns a function that in turn resolves a given service request.
 */
export class Lazy<T> extends Resolver<() => T> {
  public static of<T>(req: ServiceRequest<T>): Lazy<T> {
    return new Lazy(req);
  }

  constructor(
    public readonly req: ServiceRequest<T>
  ) { super(); }

  public resolve(container: Container) {
    return () => container.resolve(this.req);
  }
}

/**
 * Resolver that returns the resolved key.
 */
export class Lookup<T> extends Resolver<T> {
  public static of<T>(key: ServiceIdentifier<T>): Lookup<T> {
    return new Lookup(key);
  }

  constructor(
    public readonly key: ServiceIdentifier<T>
  ) { super(); }

  public resolve(container: Container) {
    return container.resolve(this.key);
  }
}

/**
 * Resolver that returns the resolved key if it was registered.
 */
export class Optional<T> extends Resolver<T | undefined> {
  public static of<T>(key: ServiceIdentifier<T>): Optional<T> {
    return new Optional(key);
  }

  constructor(
    public readonly key: ServiceIdentifier<T>
  ) { super(); }

  public resolve(container: Container) {
    return container.isRegistered(this.key) ? container.resolve(this.key) : undefined;
  }
}
